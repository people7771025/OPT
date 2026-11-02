// 內文數字範例回歸測試：直接從 index.html 擷取內文數字，用 node 重算後比對。
// 對應 tests/AUDIT-2026-11.md；修正過的項目在這裡釘住，未決項目以 test.todo 記錄。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readIndexHtml, contentHtml, htmlToText, loadApp } from './helpers/load-script.mjs';

const body = contentHtml(readIndexHtml());
const section = id => {
  const i = body.indexOf(`<section data-chapter="${id}">`);
  assert.ok(i >= 0, id);
  const j = body.indexOf('<section data-chapter=', i + 10);
  return htmlToText(body.slice(i, j < 0 ? undefined : j)).replace(/\s+/g, ' ');
};
const n = s => Number(String(s).replace(/,/g, ''));
const { MarginSimulator: MS, Math2 } = loadApp().api;

describe('Ch20 / Ch21：保證金表與 MarginSimulator 常數一致', () => {
  const ch20 = section('ch20');
  for (const [label, key] of [['TX', 'TX'], ['MTX', 'MTX'], ['TMF（微台）', 'TMF']]) {
    test(`保證金表 ${label} 列 = 元件常數`, () => {
      const m = ch20.match(new RegExp(`${label.replace(/[()（）]/g, '.')} NT\\$([\\d,]+) NT\\$([\\d,]+) NT\\$([\\d,]+)`));
      assert.ok(m, label);
      const c = MS.CONTRACTS[key];
      assert.deepEqual([n(m[1]), n(m[2]), n(m[3])], [c.initial, c.maint, c.settle]);
    });
  }
  test('Ch20：三契約槓桿 ≈ 22 倍（4,000,000 ÷ 184,000）', () => {
    assert.match(ch20, /22 倍/);
    assert.equal(Math.round(20000 * 200 / MS.CONTRACTS.TX.initial), 22);
  });
  test('Ch21：跌 215 點 margin call、跌 245 點強制平倉 = (原始 − 維持/結算) ÷ 200', () => {
    const ch21 = section('ch21');
    assert.match(ch21, /−\$43,000 → 跌 215 點/);
    assert.match(ch21, /−\$49,000 → 跌 245 點/);
    assert.equal((MS.CONTRACTS.TX.initial - MS.CONTRACTS.TX.maint) / 200, 215);
    assert.equal((MS.CONTRACTS.TX.initial - MS.CONTRACTS.TX.settle) / 200, 245);
  });
});

describe('Ch16 Iron Condor 實例（含情境 C 修正）', () => {
  const ch16 = section('ch16');
  test('最大獲利 $280、最大損失 $520、BE $475.20 / $524.80', () => {
    const credit = (3.2 - 1.8) * 100 + (2.9 - 1.5) * 100;
    assert.ok(Math.abs(credit - 280) < 1e-9);
    assert.match(ch16, /最大獲利：\$280/);
    assert.match(ch16, /最大損失：\$520/);
    assert.match(ch16, /下檔 break-even：\$475\.20/);
    assert.match(ch16, /上檔 break-even：\$524\.80/);
  });
  test('情境 C：$477 落在 short strike 與 BE 之間 → +$180（不是虧損）', () => {
    const pl = 280 - Math.max(478 - 477, 0) * 100;
    assert.equal(pl, 180);
    assert.match(ch16, /short strike 與 break-even 之間（如 \$477 \/ \$523）/);
    assert.match(ch16, /小幅賺 \+\$180/);
  });
});

describe('Ch9 Wheel 三輪年化、Ch23 年化基差、案例⑦', () => {
  test('Ch9：350 ÷ 3,800 × 365/105 ≈ 32%；550 ÷ 3,800 × 365/105 ≈ 50%', () => {
    const t = section('ch9');
    assert.match(t, /≈ 32%/); assert.match(t, /≈ 50%/);
    assert.equal(Math.round(350 / 3800 * 365 / 105 * 100), 32);
    assert.equal(Math.round(550 / 3800 * 365 / 105 * 100), 50);
  });
  test('Ch23：50 / 20,050 × 365/18 ≈ +5.06%', () => {
    assert.match(section('ch23'), /\+5\.06%/);
    assert.equal((50 / 20050 * 365 / 18 * 100).toFixed(2), '5.06');
  });
  const cases = section('cases');
  test('案例⑦：標題與內文年化基差同為 +10.9%（125 / 19,800 × 365/21）', () => {
    assert.equal(Math.floor(125 / 19800 * 365 / 21 * 1000) / 10, 10.9);
    assert.match(cases, /TX 年化基差 \+10\.9% · 真實期現套利執行/);
    assert.match(cases, /= \+10\.9% （觸發 > \+8% 門檻）/);
  });
  test('案例⑦：淨 edge 735 ÷ 1.9M 以實際持有 14 天年化 ≈ 1.0%', () => {
    assert.equal((735 / 1.9e6 * 365 / 14 * 100).toFixed(1), '1.0');
    assert.match(cases, /0\.04%（持有 14 天），等於年化 ~1\.0%/);
  });
  test('案例⑧：(440 − 474)×100 + 2,400 = −1,000（$600 已含在成本 $474）', () => {
    assert.equal((440 - 474) * 100 + 2400, -1000);
    assert.match(cases, /總計：約 -\$1,000/);
  });
  test('案例⑪：做空 SPY 的合成部位標為 Synthetic Short Stock', () => {
    assert.match(cases, /案例 ⑪ · Synthetic Short Stock 替代 IRA 限制/);
    assert.ok(!/Synthetic Long Stock 替代 IRA/.test(body));
  });
});

describe('Ch24 / Ch26 / Ch34 文字算式', () => {
  test('Ch24：Top10 − Top5 = 第 6–10 名', () => {
    assert.match(section('ch24'), /即「第 6–10 名」這層的部位/);
  });
  test('Ch26 Calendar：A = 450 + 500 − 700 = +250；B = −1,050 + 1,100 = +50；C = 450 + 150 − 700 = −100', () => {
    const t = section('ch26');
    assert.equal(450 + 500 - 700, 250); assert.equal(-1050 + 1100, 50); assert.equal(450 + 150 - 700, -100);
    assert.match(t, /近月收 \$450 \+ 遠月留值 \$500 − 遠月買價 \$700/);
    assert.match(t, /近月收 \$450 \+ 遠月剩值 \$150 − 遠月買價 \$700 = -\$100/);
  });
  test('Ch34 0-DTE IC：收 $300、最大虧損 (15−3)×100 = $1,200、BE 4987 / 5013、4:1', () => {
    const t = section('ch34');
    assert.equal((15 - 3) * 100, 1200);
    assert.match(t, /4990 − 3 = 4987/); assert.match(t, /5010 \+ 3 = 5013/);
    assert.equal(0.7 * 300 - 0.3 * 1200, -150); // 勝率 70% 仍負期望
  });
});

describe('內文數字範例：未決項目（todo，見 AUDIT-2026-11.md「待使用者決定」）', () => {
  test.todo('案例② TSM Wheel 三輪總計應為 $2,080（$1,730 已含輪 1 的 $320），內文與練習題 opt-cases-s3-g1 皆寫 $2,400', () => {
    assert.match(section('cases'), /= <strong>\$2,080|= \$2,080/);
  });
  test.todo('Ch3 期權鏈表：依同表假設 IV 55%、35 DTE，$145 ATM call 應約 $10（表列 ~$7.00）', () => {
    const atm = Math2.bs(145, 145, 35 / 365, 0.045, 0.55, true).price;
    assert.ok(Math.abs(atm - 7) < 1, `BS=${atm.toFixed(2)}`);
  });
  test.todo('案例① 加權 beta：(120×1 + 80×1.05 + 60×1.2 + 40×1.1)/300 = 1.067，內文寫 1.08', () => {
    assert.match(section('cases'), /加權 beta ≈ 1\.07/);
  });
});
