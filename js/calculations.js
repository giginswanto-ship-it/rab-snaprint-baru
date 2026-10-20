// js/calculations.js - Financial, Capex, Working Capital & BEP calculation engine

const Calculations = {
  // Format Indonesian Rupiah
  formatRupiah(number) {
    if (number === null || number === undefined || isNaN(number)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(Math.round(number));
  },

  // Format simple number with thousand separator
  formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) return "0";
    return new Intl.NumberFormat("id-ID").format(Math.round(number));
  },

  // Calculate CAPEX from categories with discount support
  calculateCapex(data) {
    let totalGross = 0;
    let totalItemDiscount = 0;
    let totalRealized = 0;
    const categorySummaries = [];

    data.categories.forEach(cat => {
      let subtotalGross = 0;
      let subtotalDiscount = 0;
      let subtotalNet = 0;
      let realizedSubtotal = 0;

      cat.items.forEach(item => {
        const itemGross = (item.vol || 0) * (item.price || 0);
        const itemDisc = Math.min(itemGross, Math.max(0, parseFloat(item.discount || 0)));
        const itemNet = Math.max(0, itemGross - itemDisc);

        subtotalGross += itemGross;
        subtotalDiscount += itemDisc;
        subtotalNet += itemNet;

        if (item.status === 'purchased') {
          realizedSubtotal += itemNet;
        } else if (item.status === 'in_progress') {
          realizedSubtotal += (itemNet * 0.5); // DP 50%
        }
      });

      totalGross += subtotalGross;
      totalItemDiscount += subtotalDiscount;
      totalRealized += realizedSubtotal;

      categorySummaries.push({
        id: cat.id,
        code: cat.code,
        name: cat.name,
        color: cat.color,
        subtotalGross: subtotalGross,
        subtotalDiscount: subtotalDiscount,
        subtotal: subtotalNet, // Net subtotal
        realized: realizedSubtotal,
        itemCount: cat.items.length
      });
    });

    // Global / Special Discount calculation
    let totalGlobalDiscount = 0;
    const discConf = data.discount || { enabled: false, type: 'nominal', value: 0 };
    if (discConf.enabled && discConf.value > 0) {
      const netBeforeGlobal = Math.max(0, totalGross - totalItemDiscount);
      if (discConf.type === 'percent') {
        totalGlobalDiscount = (netBeforeGlobal * Math.min(100, Math.max(0, discConf.value))) / 100;
      } else {
        totalGlobalDiscount = Math.min(netBeforeGlobal, Math.max(0, parseFloat(discConf.value) || 0));
      }
    }

    const totalDiscount = totalItemDiscount + totalGlobalDiscount;
    const grandTotal = Math.max(0, totalGross - totalDiscount);

    // Compute share percentages based on net
    categorySummaries.forEach(cat => {
      cat.sharePercent = grandTotal > 0 ? (cat.subtotal / grandTotal) * 100 : 0;
      cat.realizationPercent = cat.subtotal > 0 ? (cat.realized / cat.subtotal) * 100 : 0;
    });

    return {
      totalGross,
      totalItemDiscount,
      totalGlobalDiscount,
      totalDiscount,
      discountPercent: totalGross > 0 ? (totalDiscount / totalGross) * 100 : 0,
      grandTotal, // Net Total
      realizedTotal: totalRealized,
      remainingTotal: Math.max(0, grandTotal - totalRealized),
      realizationPercent: grandTotal > 0 ? (totalRealized / grandTotal) * 100 : 0,
      categories: categorySummaries
    };
  },

  // Calculate OPEX Runway and Initial Working Capital
  calculateWorkingCapital(data) {
    const wc = data.workingCapital;
    const runway = wc.runwayMonths || 3;

    // Monthly salaries
    let monthlySalaries = 0;
    let staffCount = 0;
    wc.salaries.forEach(s => {
      monthlySalaries += (s.count || 0) * (s.salaryPerMonth || 0);
      staffCount += (s.count || 0);
    });

    // Monthly utilities
    let monthlyUtilities = 0;
    wc.utilities.forEach(u => {
      monthlyUtilities += (u.costPerMonth || 0);
    });

    // Monthly Amortized Rent
    const monthlyAmortizedRent = (wc.rentPerYear || 0) / 12;
    const monthlyMarketing = wc.marketingMonthly || 0;

    // Monthly Fixed Operational Burn Rate
    const monthlyOpex = monthlySalaries + monthlyUtilities + monthlyAmortizedRent + monthlyMarketing;

    // Upfront cash required for rent
    // For instance, paying rent upfront for X months (typically 12 months) + security deposit
    const rentCashNeeded = ((wc.rentPerYear || 0) / 12 * (wc.rentPaymentMonths || 12)) + (wc.rentDeposit || 0);

    // Runway buffers
    const salariesBuffer = monthlySalaries * runway;
    const utilitiesBuffer = monthlyUtilities * runway;
    const marketingBuffer = monthlyMarketing * runway;
    const pettyCashBuffer = wc.pettyCashBuffer || 0;

    // Total Working Capital needed at launch
    const totalWorkingCapital = rentCashNeeded + salariesBuffer + utilitiesBuffer + marketingBuffer + pettyCashBuffer;

    return {
      runwayMonths: runway,
      staffCount,
      monthlySalaries,
      monthlyUtilities,
      monthlyAmortizedRent,
      monthlyMarketing,
      monthlyOpex,
      rentCashNeeded,
      salariesBuffer,
      utilitiesBuffer,
      marketingBuffer,
      pettyCashBuffer,
      totalWorkingCapital
    };
  },

  // Calculate Combined Initial Capital (Modal Awal Lengkap)
  calculateModalAwal(data) {
    const capex = this.calculateCapex(data);
    const wc = this.calculateWorkingCapital(data);
    const totalModalAwal = capex.grandTotal + wc.totalWorkingCapital;

    // Scenarios:
    // 1. Minimum / Lean: 1 Month Runway, 6 months rent upfront, 5jt buffer
    const opexMin = ((data.workingCapital.rentPerYear / 12) * 6) + wc.monthlySalaries * 1 + wc.monthlyUtilities * 1 + wc.monthlyMarketing * 1 + 5000000;
    const modalMin = capex.grandTotal + opexMin;

    // 2. Recommended / Moderat: Current settings (3 months runway, 1 year rent, 15jt buffer)
    const modalModerat = totalModalAwal;

    // 3. Conservative / Safe: 6 Months Runway, 1 year rent + deposit, 25jt buffer
    const opexSafe = wc.rentCashNeeded + (wc.monthlySalaries * 6) + (wc.monthlyUtilities * 6) + (wc.monthlyMarketing * 6) + 25000000;
    const modalSafe = capex.grandTotal + opexSafe;

    return {
      capexTotal: capex.grandTotal,
      capexPercent: totalModalAwal > 0 ? (capex.grandTotal / totalModalAwal) * 100 : 0,
      workingCapitalTotal: wc.totalWorkingCapital,
      workingCapitalPercent: totalModalAwal > 0 ? (wc.totalWorkingCapital / totalModalAwal) * 100 : 0,
      totalModalAwal,
      scenarios: {
        minimal: {
          label: "Skenario Lean (Minimal)",
          desc: "Sewa 6 bulan, cadangan kas 1 bulan runway. Cocok jika modal sangat terbatas & lokasi strategis cepat ramai.",
          total: modalMin,
          capex: capex.grandTotal,
          workingCapital: opexMin
        },
        moderat: {
          label: "Skenario Moderat (Rekomendasi)",
          desc: "Sewa 1 tahun penuh, cadangan gaji & operasional 3 bulan, buffer kas darurat Rp 15jt. Standar aman & stabil.",
          total: modalModerat,
          capex: capex.grandTotal,
          workingCapital: wc.totalWorkingCapital
        },
        konservatif: {
          label: "Skenario Konservatif (Aman Maksimal)",
          desc: "Sewa 1 tahun + deposit, cadangan runway 6 bulan penuh, buffer kas Rp 25jt. Tahan gejolak fase awal.",
          total: modalSafe,
          capex: capex.grandTotal,
          workingCapital: opexSafe
        }
      }
    };
  },

  // Calculate Cash Flow Termin Schedule dynamically from Capex Total
  calculateCashFlowSchedule(data) {
    const capex = this.calculateCapex(data);
    const grandTotal = capex.grandTotal;

    const schedule = data.cashFlowSchedule.map(term => {
      const calculatedNominal = (term.sharePercent / 100) * grandTotal;
      return {
        ...term,
        calculatedNominal
      };
    });

    const totalCalculated = schedule.reduce((sum, s) => sum + s.calculatedNominal, 0);
    const paidTotal = schedule.filter(s => s.status === 'done').reduce((sum, s) => sum + s.calculatedNominal, 0);
    const inProgressTotal = schedule.filter(s => s.status === 'in_progress').reduce((sum, s) => sum + s.calculatedNominal, 0);
    const pendingTotal = schedule.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.calculatedNominal, 0);

    return {
      schedule,
      totalCalculated,
      paidTotal,
      inProgressTotal,
      pendingTotal,
      paidPercent: grandTotal > 0 ? (paidTotal / grandTotal) * 100 : 0
    };
  },

  // Financial Business Simulation, Dual-Engine BEP & Pro-Forma Cashflow
  calculateSimulation(data) {
    const sim = data.simulation || {};
    const wc = this.calculateWorkingCapital(data);
    const modalAwal = this.calculateModalAwal(data);
    const capex = this.calculateCapex(data);

    const workDays = sim.workDaysPerMonth || 26;

    // 1. Lini Produksi A: Mesin Laser A3+
    const dailyA3 = sim.dailyA3Prints || 450;
    const a3Price = sim.a3SellPrice || 5000;
    const a3Hpp = sim.a3HppCost || 2150;
    const monthlyA3Prints = dailyA3 * workDays;
    const revenueA3 = monthlyA3Prints * a3Price;
    const hppA3 = monthlyA3Prints * a3Hpp;
    const grossProfitA3 = revenueA3 - hppA3;
    const marginA3Percent = revenueA3 > 0 ? (grossProfitA3 / revenueA3) * 100 : 0;

    // 2. Lini Produksi B: Mesin Outdoor 3.2m (Banner Flexi)
    const dailyOutdoorM2 = sim.dailyOutdoorM2 || 35;
    const outdoorPrice = sim.outdoorSellPrice || 22000;
    const outdoorHpp = sim.outdoorHppCost || 9500;
    const monthlyOutdoorM2 = dailyOutdoorM2 * workDays;
    const revenueOutdoor = monthlyOutdoorM2 * outdoorPrice;
    const hppOutdoor = monthlyOutdoorM2 * outdoorHpp;
    const grossProfitOutdoor = revenueOutdoor - hppOutdoor;
    const marginOutdoorPercent = revenueOutdoor > 0 ? (grossProfitOutdoor / revenueOutdoor) * 100 : 0;

    // 3. Lini Pendukung C: Finishing & Produk Retail Lainnya
    const revenueOther = sim.monthlyOtherProductsSales || 12500000;
    const otherMarginPct = sim.otherProductsMarginPercent || 55;
    const grossProfitOther = revenueOther * (otherMarginPct / 100);
    const hppOther = revenueOther - grossProfitOther;

    // Monthly Totals
    const totalMonthlyRevenue = revenueA3 + revenueOutdoor + revenueOther;
    const totalMonthlyHpp = hppA3 + hppOutdoor + hppOther;
    const totalMonthlyGrossProfit = grossProfitA3 + grossProfitOutdoor + grossProfitOther;
    const grossMarginPercent = totalMonthlyRevenue > 0 ? (totalMonthlyGrossProfit / totalMonthlyRevenue) * 100 : 0;

    // Fixed Monthly OPEX
    const monthlyFixedCost = wc.monthlyOpex;

    // Total Monthly Expense & Cost Percentages (% Biaya)
    const totalMonthlyExpense = totalMonthlyHpp + monthlyFixedCost;
    const expenseRatioPercent = totalMonthlyRevenue > 0 ? (totalMonthlyExpense / totalMonthlyRevenue) * 100 : 0;
    const hppRatioPercent = totalMonthlyRevenue > 0 ? (totalMonthlyHpp / totalMonthlyRevenue) * 100 : 0;
    const opexRatioPercent = totalMonthlyRevenue > 0 ? (monthlyFixedCost / totalMonthlyRevenue) * 100 : 0;

    // Monthly Net Profit (Hasil Bersih Operasional EBITDA)
    const monthlyNetProfit = totalMonthlyGrossProfit - monthlyFixedCost;
    const netProfitMarginPercent = totalMonthlyRevenue > 0 ? (monthlyNetProfit / totalMonthlyRevenue) * 100 : 0;

    // 4. BEP (Break Even Point) Analysis
    // a. BEP Omset Penjualan per Bulan = Fixed Cost / Gross Margin %
    const bepMonthlyRevenue = grossMarginPercent > 0 ? (monthlyFixedCost / (grossMarginPercent / 100)) : 0;

    // b. BEP Proporsional untuk A3+ dan Outdoor 3.2m
    const totalGross = totalMonthlyGrossProfit > 0 ? totalMonthlyGrossProfit : 1;
    const shareA3 = grossProfitA3 / totalGross;
    const shareOutdoor = grossProfitOutdoor / totalGross;

    const unitMarginA3 = Math.max(1, a3Price - a3Hpp);
    const unitMarginOutdoor = Math.max(1, outdoorPrice - outdoorHpp);

    const bepA3SheetsPerMonth = Math.round((monthlyFixedCost * shareA3) / unitMarginA3);
    const bepA3SheetsPerDay = Math.ceil(bepA3SheetsPerMonth / workDays);

    const bepOutdoorM2PerMonth = Math.round((monthlyFixedCost * shareOutdoor) / unitMarginOutdoor);
    const bepOutdoorM2PerDay = Math.ceil(bepOutdoorM2PerMonth / workDays);

    // c. Target Balik Modal Horizon (Target Payback Goal)
    const targetPaybackMonths = sim.targetPaybackMonths || 18;
    const requiredMonthlyNetProfit = modalAwal.totalModalAwal > 0 ? (modalAwal.totalModalAwal / targetPaybackMonths) : 0;
    const targetMonthlyRevenue = grossMarginPercent > 0 ? ((monthlyFixedCost + requiredMonthlyNetProfit) / (grossMarginPercent / 100)) : 0;
    const targetProfitGap = monthlyNetProfit - requiredMonthlyNetProfit;
    const isTargetAchieved = monthlyNetProfit >= requiredMonthlyNetProfit;
    const targetAchievementPercent = requiredMonthlyNetProfit > 0 ? (monthlyNetProfit / requiredMonthlyNetProfit) * 100 : 0;

    // Payback Period (Aktual berdasarkan parameter aktif)
    const paybackMonthsTotalModal = monthlyNetProfit > 0 ? (modalAwal.totalModalAwal / monthlyNetProfit) : 999;
    const paybackMonthsCapexOnly = monthlyNetProfit > 0 ? (modalAwal.capexTotal / monthlyNetProfit) : 999;

    // Annual ROI
    const annualNetProfit = monthlyNetProfit * 12;
    const annualRoiPercent = modalAwal.totalModalAwal > 0 ? (annualNetProfit / modalAwal.totalModalAwal) * 100 : 0;

    // 5. 12-Month Detailed Pro-Forma Cashflow Projection
    const rampUpRates = [0.45, 0.65, 0.80, 0.90, 1.00, 1.00, 1.05, 1.10, 1.15, 1.15, 1.20, 1.25];
    const monthlyProjections = [];
    let cumulativeCashflow = -modalAwal.totalModalAwal;
    let cashBalance = wc.pettyCashBuffer || 15000000;

    for (let month = 1; month <= 12; month++) {
      const factor = rampUpRates[month - 1];
      const mRevA3 = revenueA3 * factor;
      const mRevOutdoor = revenueOutdoor * factor;
      const mRevOther = revenueOther * factor;
      const mRev = mRevA3 + mRevOutdoor + mRevOther;

      const mHpp = totalMonthlyHpp * factor;
      const mGross = mRev - mHpp;
      const mNet = mGross - monthlyFixedCost;
      const mTotalCost = mHpp + monthlyFixedCost;
      const mCostPercent = mRev > 0 ? (mTotalCost / mRev) * 100 : 0;
      const mNetMarginPercent = mRev > 0 ? (mNet / mRev) * 100 : 0;

      cumulativeCashflow += mNet;
      cashBalance += mNet;

      monthlyProjections.push({
        month: `Bulan ${month}`,
        factor: Math.round(factor * 100),
        revA3: mRevA3,
        revOutdoor: mRevOutdoor,
        revOther: mRevOther,
        revenue: mRev,
        hpp: mHpp,
        grossProfit: mGross,
        fixedCost: monthlyFixedCost,
        totalCost: mTotalCost,
        costPercent: mCostPercent,
        netProfit: mNet,
        hasilBersih: mNet,
        netMarginPercent: mNetMarginPercent,
        cashBalance: cashBalance,
        cumulativeCashflow: cumulativeCashflow
      });
    }

    // 6. Multi-Year Projections (3 Tahun)
    const year1Revenue = monthlyProjections.reduce((sum, p) => sum + p.revenue, 0);
    const year1NetProfit = monthlyProjections.reduce((sum, p) => sum + p.netProfit, 0);
    const year2Revenue = totalMonthlyRevenue * 12 * 1.15; // +15% growth
    const year2NetProfit = (totalMonthlyGrossProfit * 12 * 1.15) - (monthlyFixedCost * 12 * 1.05);
    const year3Revenue = year2Revenue * 1.12; // +12% growth
    const year3NetProfit = (totalMonthlyGrossProfit * 12 * 1.15 * 1.12) - (monthlyFixedCost * 12 * 1.08);

    return {
      workDays,
      dailyA3,
      a3Price,
      a3Hpp,
      monthlyA3Prints,
      revenueA3,
      hppA3,
      grossProfitA3,
      marginA3Percent,
      dailyOutdoorM2,
      outdoorPrice,
      outdoorHpp,
      monthlyOutdoorM2,
      revenueOutdoor,
      hppOutdoor,
      grossProfitOutdoor,
      marginOutdoorPercent,
      revenueOther,
      otherMarginPct,
      grossProfitOther,
      hppOther,
      totalMonthlyRevenue,
      totalMonthlyHpp,
      totalMonthlyExpense,
      expenseRatioPercent,
      hppRatioPercent,
      opexRatioPercent,
      totalMonthlyGrossProfit,
      grossMarginPercent,
      monthlyFixedCost,
      monthlyNetProfit,
      hasilBersih: monthlyNetProfit,
      netProfitMarginPercent,
      bepMonthlyRevenue,
      bepA3SheetsPerMonth,
      bepA3SheetsPerDay,
      bepOutdoorM2PerMonth,
      bepOutdoorM2PerDay,
      targetPaybackMonths,
      requiredMonthlyNetProfit,
      targetMonthlyRevenue,
      targetProfitGap,
      isTargetAchieved,
      targetAchievementPercent,
      paybackMonthsTotalModal,
      paybackMonthsCapexOnly,
      annualRoiPercent,
      annualNetProfit,
      monthlyProjections,
      multiYear: {
        year1: { revenue: year1Revenue, netProfit: year1NetProfit },
        year2: { revenue: year2Revenue, netProfit: year2NetProfit },
        year3: { revenue: year3Revenue, netProfit: year3NetProfit },
        total3YearsProfit: year1NetProfit + year2NetProfit + year3NetProfit
      }
    };
  }
};

if (typeof window !== 'undefined') {
  window.Calculations = Calculations;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Calculations;
}
