// 保護：PayoffDiagram（Ch2/5/6/7/8/14/15 的 7 個 payoff 圖）、PMCCBuilder（Ch30）、
// SyntheticBuilder（Ch32）、WheelSimulator（Ch9）的損益計算。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens, listWidgets, fakeWidget, decodeAttr } from './helpers/load-script.mjs';

const { PayoffDiagram: PD, PMCCBuilder: PMCC, SyntheticBuilder: SYN, WheelSimulator: WS } = loadApp().api;

const L = {
  stock: (entry, qty, action = 'buy') => ({ side: 'stock', action, entry, qty }),
  call: (strike, premium, action = 'buy', qty = 1) => ({ side: 'call', action, strike, premium, qty }),
  put: (strike, premium, action = 'buy', qty = 1) => ({ side: 'put', action, strike, premium, qty }),
};
function parsePayoff(text) {
  const g = re => (text.match(re) || [])[1];
  const money = s => (s == null ? NaN : Number(s.replace(/[$,+]/g, '')));
  return {
    current: money(g(/當前部位（spot 到期 P\/L）\s*([+-]?\$-?[\d,]+)/)),
    maxProfit: g(/最大獲利\s*(\+∞|\+\$[\d,]+)/),
    maxLoss: g(/最大虧損\s*(−∞|\$-?[\d,]+)/),
    breakevens: (g(/Break-even\s*([^\n]+)/) || '').split(',').map(s => Number(s.replace(/[$\s]/g, ''))).filter(Number.isFinite),
  };
}

describe('PayoffDiagram.calcExpiryPL：內文案例手算', () => {
  test('Ch5 Covered Call（200 股 @145 + 賣 2 張 160C @4.50）：持平 +$900、≥$160 封頂 +$3,900、BE $140.50', () => {
    const legs = [L.stock(145, 200), L.call(160, 4.5, 'sell', 2)];
    assert.equal(PD.calcExpiryPL(legs, 145), 900);
    assert.equal(PD.calcExpiryPL(legs, 160), 3900);
    assert.equal(PD.calcExpiryPL(legs, 200), 3900);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 140.5)) < 1e-9);
  });
  test('Ch6 CSP（賣 170P @3.20）：≥$170 +$320、$166.80 打平、$160 −$680', () => {
    const legs = [L.put(170, 3.2, 'sell')];
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 170) - 320) < 1e-9);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 166.8)) < 1e-9);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 160) + 680) < 1e-9);
  });
  test('Ch7 Protective Put（200 股 @145 + 買 2 張 135P @2.80）：$160 +$2,440、$120 −$2,560、持平 −$560', () => {
    const legs = [L.stock(145, 200), L.put(135, 2.8, 'buy', 2)];
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 160) - 2440) < 1e-9);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 120) + 2560) < 1e-9);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 145) + 560) < 1e-9);
  });
  test('Ch8 Collar（100 股 @195 + 買 185P @2.40 + 賣 210C @2.30）：$210 以上 +$1,490、$170 −$1,010', () => {
    const legs = [L.stock(195, 100), L.put(185, 2.4), L.call(210, 2.3, 'sell')];
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 230) - 1490) < 1e-9);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 170) + 1010) < 1e-9);
  });
  test('Ch15 Bull Call Spread（買 145C @7、賣 160C @4.50）：最大 +$1,250、最大 −$250、BE $147.50', () => {
    const legs = [L.call(145, 7), L.call(160, 4.5, 'sell')];
    assert.equal(PD.calcExpiryPL(legs, 200), 1250);
    assert.equal(PD.calcExpiryPL(legs, 100), -250);
    assert.ok(Math.abs(PD.calcExpiryPL(legs, 147.5)) < 1e-9);
  });
  test('空頭股票腿：放空 100 股 @50，股價 40 → +$1,000', () => {
    assert.equal(PD.calcExpiryPL([L.stock(50, 100, 'sell')], 40), 1000);
  });
});

describe('PayoffDiagram.boundaryRisk：無限風險偵測', () => {
  const cases = [
    ['裸買 call：獲利無限', [L.call(100, 5)], true, false],
    ['裸賣 call：虧損無限', [L.call(100, 5, 'sell')], false, true],
    ['Covered Call：上端斜率 0 → 皆有限', [L.stock(100, 100), L.call(110, 2, 'sell')], false, false],
    ['裸賣 put：上端斜率 0（下端以 price=0 計，有限）', [L.put(100, 5, 'sell')], false, false],
    ['持股：獲利無限', [L.stock(100, 100)], true, false],
    ['放空股票：虧損無限', [L.stock(100, 100, 'sell')], false, true],
    ['賣 2 張 call 只持 100 股：淨上端斜率 −100 → 虧損無限', [L.stock(100, 100), L.call(110, 2, 'sell', 2)], false, true],
  ];
  for (const [name, legs, profitInf, lossInf] of cases) {
    test(name, () => {
      const r = PD.boundaryRisk(legs);
      assert.equal(r.maxProfitInfinite, profitInf);
      assert.equal(r.maxLossInfinite, lossInf);
    });
  }
});

describe('PayoffDiagram.findBreakevens', () => {
  test('Long Straddle（100C@5 + 100P@5）兩個 BE：90 / 110', () => {
    const be = PD.findBreakevens([L.call(100, 5), L.put(100, 5)], 50, 150);
    assert.equal(be.length, 2);
    assert.ok(Math.abs(be[0] - 90) < 0.05 && Math.abs(be[1] - 110) < 0.05, `${be}`);
  });
  test('永遠為正的部位：沒有 BE', () => {
    assert.equal(PD.findBreakevens([L.call(100, -1)], 50, 150).length, 0);
  });
  test('順序顛倒（xMin > xMax）不丟例外', () => {
    assert.doesNotThrow(() => PD.findBreakevens([L.call(100, 5)], 150, 50));
  });
});

describe('PayoffDiagram：全站 7 個 payoff widget 渲染快照', () => {
  const widgets = listWidgets().filter(w => w.type === 'payoff');
  test('共 7 個 payoff widget，data-legs 皆可解析', () => {
    assert.equal(widgets.length, 7);
    for (const w of widgets) assert.ok(Array.isArray(JSON.parse(decodeAttr(w.attrs['data-legs']))));
  });
  const expected = {
    // [spot 到期 P/L, 最大獲利, 最大虧損, BE]
    '145|call:buy:160': [-450, '+∞', '$-450', [164.5]],
    '145|call:buy:145': [-700, '+∞', '$-700', [152]],
    '145|stock:buy:+call:sell:160': [900, '+$3900', '$-28100', [140.5]],
    '180|put:sell:170': [320, '+$320', '$-16680', [166.8]],
    '145|stock:buy:+put:buy:135': [-560, '+∞', '$-2560', [147.8]],
    '195|stock:buy:+put:buy:185+call:sell:210': [-10, '+$1490', '$-1010', [195.1]],
    '145|call:buy:145+call:sell:160': [-250, '+$1250', '$-250', [147.5]],
  };
  for (const w of widgets) {
    const legs = JSON.parse(decodeAttr(w.attrs['data-legs']));
    const key = w.attrs['data-spot'] + '|' + legs.map(l => `${l.side}:${l.action}:${l.strike ?? ''}`).join('+');
    test(`第 ${w.line} 行 payoff（${key}）`, () => {
      const fw = fakeWidget(w.attrs);
      PD.hydrate(fw);
      const text = fw.body.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const r = parsePayoff(text.replace(/ (?=最大|Break)/g, '\n'));
      assert.ok(expected[key], `未登錄的 payoff：${key}`);
      const [cur, maxP, maxL, be] = expected[key];
      assert.equal(r.current, cur);
      assert.equal(r.maxProfit, maxP);
      assert.equal(r.maxLoss, maxL);
      assert.deepEqual(r.breakevens, be);
      assert.deepEqual(badTokens(fw.body.innerHTML), []);
    });
  }
  test('裸賣 call 顯示「−∞（無限）」與風險警語', () => {
    const { text } = render(PD, { spot: 100, legs: [L.call(110, 2, 'sell')] });
    assert.ok(text.includes('−∞（無限）') && text.includes('此端風險無限'));
  });
  test('spot = 0 夾到 0.01，不破圖（無 NaN）', () => {
    assert.deepEqual(badTokens(render(PD, { spot: 0, legs: [L.call(110, 2)] }).html), []);
  });
});

describe('PMCCBuilder：預設情境（Ch30 widget）與手算', () => {
  const st = { spot: 145, leapsStrike: 100, leapsPremium: 55, leapsDelta: 0.78, shortStrike: 160, shortPremium: 4.5 };
  const { text } = render(PMCC, st);
  test('PMCC 投入 $5,500、月收 $450、ROI 8.18%/月、BE $150.50', () => {
    assert.ok(text.includes('投入： $5,500'));
    assert.ok(text.includes('ROI: 8.18% / 月'));
    assert.ok(text.includes('Break-even: $150.50'));
  });
  test('傳統 CC 投入 $14,500、ROI 3.10%/月、BE $140.50（與 Ch30 內文 3.1% / 8.2% 一致）', () => {
    assert.ok(text.includes('投入： $14,500'));
    assert.ok(text.includes('ROI: 3.10% / 月'));
    assert.ok(text.includes('Break-even: $140.50'));
  });
  test('資金比 38%、delta 曝險 78%、ROI 倍數 2.6x', () => {
    assert.ok(/PMCC 用 38% 的傳統 CC 資金/.test(text));
    assert.ok(/約 78% 現股/.test(text));
    assert.ok(/2\.6x/.test(text));
  });
  test('手算：spot 200、LEAPS 150 @60、短 call 210 @5 → ROI 8.33% vs 2.50%、BE $205.00', () => {
    const t = render(PMCC, { spot: 200, leapsStrike: 150, leapsPremium: 60, leapsDelta: 0.8, shortStrike: 210, shortPremium: 5 }).text;
    assert.ok(t.includes('ROI: 8.33% / 月') && t.includes('ROI: 2.50% / 月') && t.includes('Break-even: $205.00'));
  });
  test('滑桿上下限組合無 NaN / Infinity', () => {
    for (const spot of [80, 250]) for (const lp of [20, 100]) for (const sp of [1, 15]) {
      assert.deepEqual(badTokens(render(PMCC, { ...st, spot, leapsPremium: lp, shortPremium: sp }).text), []);
    }
  });
});

describe('SyntheticBuilder（Ch32）：合成部位 = put-call parity 的兩腿', () => {
  const pl = (target, k, price) => PD.calcExpiryPL(SYN.TARGETS[target].legs(k), price);
  test('合成 Long Stock（K=145，買 C@7 賣 P@6.20，淨 $80）：$160 +$1,420、$130 −$1,580（與 Ch32 內文一致）', () => {
    assert.ok(Math.abs(pl('long-stock', 145, 160) - 1420) < 1e-9);
    assert.ok(Math.abs(pl('long-stock', 145, 130) + 1580) < 1e-9);
  });
  test('合成 Long Stock 斜率 = 100 股（每 $1 = $100），合成 Short Stock 為其鏡像', () => {
    for (const p of [100, 145, 190]) {
      assert.ok(Math.abs(pl('long-stock', 145, p + 1) - pl('long-stock', 145, p) - 100) < 1e-9);
      assert.ok(Math.abs(pl('long-stock', 145, p) + pl('short-stock', 145, p)) < 1e-9);
    }
  });
  test('合成 Long Call（股 + 買 put）= max(S−K,0)×100 − 620；合成 Long Put（空股 + 買 call）= max(K−S,0)×100 − 700', () => {
    for (const p of [100, 145, 190]) {
      assert.ok(Math.abs(pl('long-call', 145, p) - (Math.max(p - 145, 0) * 100 - 620)) < 1e-9);
      assert.ok(Math.abs(pl('long-put', 145, p) - (Math.max(145 - p, 0) * 100 - 700)) < 1e-9);
    }
  });
  test('四種目標都能渲染、無 NaN，腿描述正確', () => {
    for (const target of Object.keys(SYN.TARGETS)) {
      const { text } = render(SYN, { target, spot: 145, strike: 145 });
      assert.deepEqual(badTokens(text), [], target);
      assert.ok(text.includes(SYN.TARGETS[target].name));
    }
    assert.ok(render(SYN, { target: 'long-stock', spot: 145, strike: 145 }).text.includes('買 1 張 Call K=$145 P=$7'));
  });
});

describe('WheelSimulator（Ch9）', () => {
  const DEF = { startSpot: 180, ivPercentile: 65, rounds: 12, monthlyDrift: 0.5, monthlyVol: 7, seed: 42 };
  test('estMonthlyYield：IVP 30 → 0.8%/月、IVP ≤15 下限 0.4%、IVP 60 → 1.6%', () => {
    assert.ok(Math.abs(WS.estMonthlyYield(30) - 0.008) < 1e-12);
    assert.ok(Math.abs(WS.estMonthlyYield(10) - 0.004) < 1e-12);
    assert.ok(Math.abs(WS.estMonthlyYield(60) - 0.016) < 1e-12);
  });
  test('預設情境快照（seed 42）：12 輪、第 2 輪被 assign、第 5 輪 @180 賣出、期末持股 100 股', () => {
    const r = WS.simulateRounds(DEF);
    assert.equal(r.log.length, 12);
    assert.equal(r.log[1].outcome, '被 assign 接 100 股');
    assert.equal(r.log[4].outcome, '被 assign 賣 100 股 @ 180');
    assert.equal(r.finalShares, 100);
    assert.equal(Math.round(r.totalEquity), -519);
  });
  test('決定性：同 seed 結果完全相同（冪等）；不同 seed 路徑不同', () => {
    assert.deepEqual(JSON.stringify(WS.simulateRounds(DEF)), JSON.stringify(WS.simulateRounds(DEF)));
    assert.notEqual(JSON.stringify(WS.simulateRounds(DEF).log), JSON.stringify(WS.simulateRounds({ ...DEF, seed: 7 }).log));
  });
  test('會計恆等式：總權益 = Σ權利金 + Σ(賣出價 − 接股價)×100 + 未平倉 (期末價 − 接股價)×100', () => {
    for (const seed of [1, 7, 42, 99]) for (const monthlyDrift of [-3, 0.5, 3]) {
      const st = { ...DEF, seed, monthlyDrift, monthlyVol: 15, rounds: 24 };
      const r = WS.simulateRounds(st);
      let prem = 0, realized = 0, openStrike = null;
      for (const row of r.log) {
        prem += Number(row.premium);
        if (row.phase === 'CSP' && row.outcome.startsWith('被 assign')) openStrike = Number(row.strike);
        if (row.phase === 'CC' && row.outcome.startsWith('被 assign')) { realized += (Number(row.strike) - openStrike) * 100; openStrike = null; }
      }
      const unreal = openStrike == null ? 0 : (r.finalSpot - openStrike) * 100;
      // log 內數字已 toFixed（權利金取整、strike 兩位），容許每輪 1 元誤差
      assert.ok(Math.abs(r.totalEquity - (prem + realized + unreal)) <= r.log.length * 1.5, `seed=${seed} drift=${monthlyDrift}`);
    }
  });
  test('CC strike 永不低於有效接股成本（strike − 每股權利金）', () => {
    for (const seed of [1, 13, 42, 77, 100]) {
      const r = WS.simulateRounds({ ...DEF, seed, monthlyDrift: -3, monthlyVol: 20, rounds: 24 });
      let cost = null;
      for (const row of r.log) {
        if (row.phase === 'CSP' && row.outcome.startsWith('被 assign')) cost = Number(row.strike) - Number(row.premium) / 100;
        if (row.phase === 'CC') assert.ok(Number(row.strike) >= cost - 0.05, `seed=${seed} round=${row.round}`); // log 內 strike 兩位、權利金取整，容許 0.05
      }
    }
  });
  test('狀態機：CC 只會出現在被 assign 之後；持股時期末 finalShares = 100', () => {
    const r = WS.simulateRounds(DEF);
    let holding = false;
    for (const row of r.log) {
      assert.equal(row.phase, holding ? 'CC' : 'CSP');
      if (row.outcome.startsWith('被 assign')) holding = !holding;
    }
    assert.equal(r.finalShares, holding ? 100 : 0);
  });
  test('滑桿上下限（輪次 3/24、漂移 ±3、波動 3/20、IVP 20/90）渲染無 NaN', () => {
    for (const rounds of [3, 24]) for (const monthlyDrift of [-3, 3]) for (const monthlyVol of [3, 20]) for (const ivPercentile of [20, 90]) {
      assert.deepEqual(badTokens(render(WS, { ...DEF, rounds, monthlyDrift, monthlyVol, ivPercentile }).text), []);
    }
  });
  test.todo('hydrate：data-monthly-drift="0" 應為 0%，目前 `|| 0.5` 把 0 當缺值改成 0.5%', () => {
    const w = fakeWidget({ 'data-start-spot': '180', 'data-monthly-drift': '0' });
    WS.hydrate(w);
    assert.ok(/data-input="monthlyDrift" value="0"/.test(w.body.innerHTML));
  });
});
