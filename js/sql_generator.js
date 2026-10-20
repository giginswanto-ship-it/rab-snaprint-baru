// js/sql_generator.js - Universal SQL Generator & Exporter for Snaprint
(function(root) {
  function escapeSql(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return isNaN(val) ? '0' : String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    return "'" + String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
  }

  function generateSqlDump(data) {
    if (!data) return '';
    const now = new Date().toISOString();
    const meta = data.meta || {};
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const cashFlow = Array.isArray(data.cashFlowSchedule) ? data.cashFlowSchedule : [];
    const wc = data.workingCapital || {};
    const salaries = Array.isArray(wc.salaries) ? wc.salaries : [];
    const utilities = Array.isArray(wc.utilities) ? wc.utilities : [];
    const sim = data.simulation || {};
    const scenarios = sim.scenarios || {};
    const bp = data.businessPlan || {};
    const segments = Array.isArray(bp.marketSegments) ? bp.marketSegments : [];
    const props = Array.isArray(bp.valuePropositions) ? bp.valuePropositions : [];
    const discount = data.discount || {};

    let sql = `-- ==============================================================================
-- DATABASE SCHEMA & SEED DATA: RAB SNAPRINT DIGITAL PRINTING
-- Sistem Terintegrasi Rencana Anggaran Biaya & Perkiraan Modal Awal Outlet Baru
-- Dokumen No: ${meta.documentNo || 'RAB-SNP/2026/04-01'}
-- Digenerate otomatis oleh Sistem Live Database Snaprint
-- Waktu Ekspor: ${now}
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

CREATE DATABASE IF NOT EXISTS \`rab_snaprint\` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE \`rab_snaprint\`;

DROP VIEW IF EXISTS \`v_monthly_burn_rate\`;
DROP VIEW IF EXISTS \`v_capex_summary\`;
DROP VIEW IF EXISTS \`v_capex_per_category\`;

DROP TABLE IF EXISTS \`discount_settings\`;
DROP TABLE IF EXISTS \`business_plan_propositions\`;
DROP TABLE IF EXISTS \`business_plan_segments\`;
DROP TABLE IF EXISTS \`simulation_scenarios\`;
DROP TABLE IF EXISTS \`financial_simulations\`;
DROP TABLE IF EXISTS \`utility_costs\`;
DROP TABLE IF EXISTS \`staff_salaries\`;
DROP TABLE IF EXISTS \`working_capital_settings\`;
DROP TABLE IF EXISTS \`cash_flow_schedules\`;
DROP TABLE IF EXISTS \`capex_items\`;
DROP TABLE IF EXISTS \`categories\`;
DROP TABLE IF EXISTS \`project_meta\`;

-- 1. Tabel project_meta
CREATE TABLE \`project_meta\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`document_no\` VARCHAR(100) NOT NULL,
  \`outlet_location\` VARCHAR(255) NOT NULL,
  \`project_date\` VARCHAR(100) NOT NULL,
  \`project_status\` VARCHAR(100) NOT NULL DEFAULT 'Persiapan Fisik',
  \`target_duration\` VARCHAR(100) NOT NULL DEFAULT '4 Minggu',
  \`standard_area\` VARCHAR(100) NOT NULL DEFAULT '45 – 60 m²',
  \`machine_model\` VARCHAR(255) NOT NULL,
  \`prepared_by\` VARCHAR(255) NOT NULL,
  \`checked_by\` VARCHAR(255) NOT NULL,
  \`approved_by\` VARCHAR(255) NOT NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel categories
CREATE TABLE \`categories\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`code\` VARCHAR(10) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`color\` VARCHAR(50) NOT NULL DEFAULT 'blue',
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_categories_code\` (\`code\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel capex_items
CREATE TABLE \`capex_items\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`category_id\` VARCHAR(50) NOT NULL,
  \`code\` VARCHAR(20) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`spec\` TEXT NOT NULL,
  \`vol\` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  \`sat\` VARCHAR(50) NOT NULL DEFAULT 'Unit',
  \`price\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`discount\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`subtotal\` DECIMAL(15,2) GENERATED ALWAYS AS ((\`vol\` * \`price\`) - \`discount\`) STORED,
  \`status\` ENUM('pending', 'in_progress', 'done') NOT NULL DEFAULT 'pending',
  \`notes\` TEXT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`fk_capex_items_category\` (\`category_id\`),
  CONSTRAINT \`fk_capex_items_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabel cash_flow_schedules
CREATE TABLE \`cash_flow_schedules\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`termin\` VARCHAR(50) NOT NULL,
  \`week\` VARCHAR(50) NOT NULL,
  \`focus\` TEXT NOT NULL,
  \`share_percent\` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  \`nominal\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`status\` ENUM('pending', 'in_progress', 'done') NOT NULL DEFAULT 'pending',
  \`payment_date\` DATE NULL,
  \`ref_no\` VARCHAR(100) NULL,
  \`notes\` TEXT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabel working_capital_settings
CREATE TABLE \`working_capital_settings\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`runway_months\` INT NOT NULL DEFAULT 3,
  \`rent_per_year\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`rent_payment_months\` INT NOT NULL DEFAULT 12,
  \`rent_deposit\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`petty_cash_buffer\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`marketing_monthly\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabel staff_salaries
CREATE TABLE \`staff_salaries\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`position\` VARCHAR(255) NOT NULL,
  \`count\` INT NOT NULL DEFAULT 1,
  \`salary_per_month\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`total_per_month\` DECIMAL(15,2) GENERATED ALWAYS AS (\`count\` * \`salary_per_month\`) STORED,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabel utility_costs
CREATE TABLE \`utility_costs\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`cost_per_month\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabel financial_simulations
CREATE TABLE \`financial_simulations\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`work_days_per_month\` INT NOT NULL DEFAULT 26,
  \`daily_a3_prints\` INT NOT NULL DEFAULT 450,
  \`a3_sell_price\` DECIMAL(15,2) NOT NULL DEFAULT 5000.00,
  \`a3_hpp_cost\` DECIMAL(15,2) NOT NULL DEFAULT 2150.00,
  \`daily_outdoor_m2\` DECIMAL(10,2) NOT NULL DEFAULT 35.00,
  \`outdoor_sell_price\` DECIMAL(15,2) NOT NULL DEFAULT 22000.00,
  \`outdoor_hpp_cost\` DECIMAL(15,2) NOT NULL DEFAULT 9500.00,
  \`monthly_other_products_sales\` DECIMAL(15,2) NOT NULL DEFAULT 12500000.00,
  \`other_products_margin_percent\` DECIMAL(5,2) NOT NULL DEFAULT 55.00,
  \`target_payback_months\` INT NOT NULL DEFAULT 18,
  \`active_scenario\` VARCHAR(50) NOT NULL DEFAULT 'moderat',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabel simulation_scenarios
CREATE TABLE \`simulation_scenarios\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`scenario_key\` VARCHAR(50) NOT NULL,
  \`label\` VARCHAR(255) NOT NULL,
  \`daily_a3_prints\` INT NOT NULL,
  \`daily_outdoor_m2\` DECIMAL(10,2) NOT NULL,
  \`monthly_other_products_sales\` DECIMAL(15,2) NOT NULL,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uq_scenarios_key\` (\`scenario_key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabel business_plan_segments
CREATE TABLE \`business_plan_segments\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`share_percent\` DECIMAL(5,2) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Tabel business_plan_propositions
CREATE TABLE \`business_plan_propositions\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`proposition\` TEXT NOT NULL,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Tabel discount_settings
CREATE TABLE \`discount_settings\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`enabled\` TINYINT(1) NOT NULL DEFAULT 0,
  \`type\` VARCHAR(50) NOT NULL DEFAULT 'nominal',
  \`value\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  \`label\` VARCHAR(255) NOT NULL DEFAULT 'Potongan Khusus Kemitraan / Negosiasi Vendor',
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DATA INSERTIONS
-- ==============================================================================

-- Metadata Dokumen
INSERT INTO \`project_meta\` (\`id\`, \`document_no\`, \`outlet_location\`, \`project_date\`, \`project_status\`, \`target_duration\`, \`standard_area\`, \`machine_model\`, \`prepared_by\`, \`checked_by\`, \`approved_by\`, \`notes\`) VALUES
(1, ${escapeSql(meta.documentNo)}, ${escapeSql(meta.outletLocation)}, ${escapeSql(meta.date)}, ${escapeSql(meta.projectStatus)}, ${escapeSql(meta.targetDuration)}, ${escapeSql(meta.standardArea)}, ${escapeSql(meta.machineModel)}, ${escapeSql(meta.preparedBy)}, ${escapeSql(meta.checkedBy)}, ${escapeSql(meta.approvedBy)}, ${escapeSql(meta.notes)});
`;

    // Categories and capex_items
    if (categories.length > 0) {
      const catRows = categories.map((cat, idx) => 
        `(${escapeSql(cat.id)}, ${escapeSql(cat.code)}, ${escapeSql(cat.name)}, ${escapeSql(cat.color || 'blue')}, ${idx + 1})`
      );
      sql += `\n-- Kategori Belanja\nINSERT INTO \`categories\` (\`id\`, \`code\`, \`name\`, \`color\`, \`sort_order\`) VALUES\n` + catRows.join(',\n') + ';\n';

      const allItems = [];
      let itemSort = 1;
      categories.forEach(cat => {
        if (Array.isArray(cat.items)) {
          cat.items.forEach(it => {
            allItems.push(`(${escapeSql(it.id)}, ${escapeSql(cat.id)}, ${escapeSql(it.code)}, ${escapeSql(it.name)}, ${escapeSql(it.spec || '')}, ${escapeSql(it.vol || 1)}, ${escapeSql(it.sat || 'Unit')}, ${escapeSql(it.price || 0)}, ${escapeSql(it.discount || 0)}, ${escapeSql(it.status || 'pending')}, ${escapeSql(it.notes || '')}, ${itemSort++})`);
          });
        }
      });
      if (allItems.length > 0) {
        sql += `\n-- Item Belanja CAPEX\nINSERT INTO \`capex_items\` (\`id\`, \`category_id\`, \`code\`, \`name\`, \`spec\`, \`vol\`, \`sat\`, \`price\`, \`discount\`, \`status\`, \`notes\`, \`sort_order\`) VALUES\n` + allItems.join(',\n') + ';\n';
      }
    }

    // Cashflow schedules
    if (cashFlow.length > 0) {
      const cfRows = cashFlow.map((cf, idx) => 
        `(${idx + 1}, ${escapeSql(cf.termin)}, ${escapeSql(cf.week)}, ${escapeSql(cf.focus)}, ${escapeSql(cf.sharePercent)}, ${escapeSql(cf.nominal)}, ${escapeSql(cf.status || 'pending')}, ${escapeSql(cf.paymentDate || null)}, ${escapeSql(cf.refNo || null)}, ${escapeSql(cf.notes || '')}, ${idx + 1})`
      );
      sql += `\n-- Jadwal Termin Pencairan Dana\nINSERT INTO \`cash_flow_schedules\` (\`id\`, \`termin\`, \`week\`, \`focus\`, \`share_percent\`, \`nominal\`, \`status\`, \`payment_date\`, \`ref_no\`, \`notes\`, \`sort_order\`) VALUES\n` + cfRows.join(',\n') + ';\n';
    }

    // Working Capital Settings
    sql += `\n-- Parameter Modal Kerja\nINSERT INTO \`working_capital_settings\` (\`id\`, \`runway_months\`, \`rent_per_year\`, \`rent_payment_months\`, \`rent_deposit\`, \`petty_cash_buffer\`, \`marketing_monthly\`) VALUES\n(1, ${escapeSql(wc.runwayMonths || 3)}, ${escapeSql(wc.rentPerYear || 0)}, ${escapeSql(wc.rentPaymentMonths || 12)}, ${escapeSql(wc.rentDeposit || 0)}, ${escapeSql(wc.pettyCashBuffer || 0)}, ${escapeSql(wc.marketingMonthly || 0)});\n`;

    // Salaries
    if (salaries.length > 0) {
      const salRows = salaries.map((s, idx) => 
        `(${escapeSql(s.id)}, ${escapeSql(s.position)}, ${escapeSql(s.count || 1)}, ${escapeSql(s.salaryPerMonth || 0)}, ${idx + 1})`
      );
      sql += `\n-- Roster Gaji Staf\nINSERT INTO \`staff_salaries\` (\`id\`, \`position\`, \`count\`, \`salary_per_month\`, \`sort_order\`) VALUES\n` + salRows.join(',\n') + ';\n';
    }

    // Utilities
    if (utilities.length > 0) {
      const utlRows = utilities.map((u, idx) => 
        `(${escapeSql(u.id)}, ${escapeSql(u.name)}, ${escapeSql(u.costPerMonth || 0)}, ${idx + 1})`
      );
      sql += `\n-- Biaya Utilitas Bulanan\nINSERT INTO \`utility_costs\` (\`id\`, \`name\`, \`cost_per_month\`, \`sort_order\`) VALUES\n` + utlRows.join(',\n') + ';\n';
    }

    // Financial simulation
    sql += `\n-- Parameter Simulator Finansial\nINSERT INTO \`financial_simulations\` (\`id\`, \`work_days_per_month\`, \`daily_a3_prints\`, \`a3_sell_price\`, \`a3_hpp_cost\`, \`daily_outdoor_m2\`, \`outdoor_sell_price\`, \`outdoor_hpp_cost\`, \`monthly_other_products_sales\`, \`other_products_margin_percent\`, \`target_payback_months\`, \`active_scenario\`) VALUES\n(1, ${escapeSql(sim.workDaysPerMonth || 26)}, ${escapeSql(sim.dailyA3Prints || 450)}, ${escapeSql(sim.a3SellPrice || 5000)}, ${escapeSql(sim.a3HppCost || 2150)}, ${escapeSql(sim.dailyOutdoorM2 || 35)}, ${escapeSql(sim.outdoorSellPrice || 22000)}, ${escapeSql(sim.outdoorHppCost || 9500)}, ${escapeSql(sim.monthlyOtherProductsSales || 12500000)}, ${escapeSql(sim.otherProductsMarginPercent || 55)}, ${escapeSql(sim.targetPaybackMonths || 18)}, ${escapeSql(sim.activeScenario || 'moderat')});\n`;

    // Scenarios
    const scKeys = Object.keys(scenarios);
    if (scKeys.length > 0) {
      const scRows = scKeys.map((k, idx) => {
        const item = scenarios[k];
        return `(${idx + 1}, ${escapeSql(k)}, ${escapeSql(item.label || k)}, ${escapeSql(item.dailyA3Prints || 0)}, ${escapeSql(item.dailyOutdoorM2 || 0)}, ${escapeSql(item.monthlyOtherProductsSales || 0)})`;
      });
      sql += `\n-- Skenario Simulasi\nINSERT INTO \`simulation_scenarios\` (\`id\`, \`scenario_key\`, \`label\`, \`daily_a3_prints\`, \`daily_outdoor_m2\`, \`monthly_other_products_sales\`) VALUES\n` + scRows.join(',\n') + ';\n';
    }

    // Segments
    if (segments.length > 0) {
      const segRows = segments.map((seg, idx) => 
        `(${idx + 1}, ${escapeSql(seg.name)}, ${escapeSql(seg.share || 0)}, ${escapeSql(seg.desc || '')}, ${idx + 1})`
      );
      sql += `\n-- Segmentasi Pasar\nINSERT INTO \`business_plan_segments\` (\`id\`, \`name\`, \`share_percent\`, \`description\`, \`sort_order\`) VALUES\n` + segRows.join(',\n') + ';\n';
    }

    // Propositions
    if (props.length > 0) {
      const propRows = props.map((pr, idx) => 
        `(${idx + 1}, ${escapeSql(pr)}, ${idx + 1})`
      );
      sql += `\n-- Value Propositions\nINSERT INTO \`business_plan_propositions\` (\`id\`, \`proposition\`, \`sort_order\`) VALUES\n` + propRows.join(',\n') + ';\n';
    }

    // Discount
    sql += `\n-- Diskon Global\nINSERT INTO \`discount_settings\` (\`id\`, \`enabled\`, \`type\`, \`value\`, \`label\`) VALUES\n(1, ${discount.enabled ? 1 : 0}, ${escapeSql(discount.type || 'nominal')}, ${escapeSql(discount.value || 0)}, ${escapeSql(discount.label || 'Potongan Khusus Kemitraan / Negosiasi Vendor')});\n`;

    // Helper views
    sql += `
-- ==============================================================================
-- VIEW HELPER UNTUK LAPORAN & KALKULASI CEPAT
-- ==============================================================================

CREATE OR REPLACE VIEW \`v_capex_per_category\` AS
SELECT 
  c.id AS category_id,
  c.code AS category_code,
  c.name AS category_name,
  c.color,
  COUNT(i.id) AS total_items,
  COALESCE(SUM(i.subtotal), 0) AS total_amount
FROM \`categories\` c
LEFT JOIN \`capex_items\` i ON c.id = i.category_id
GROUP BY c.id, c.code, c.name, c.color, c.sort_order
ORDER BY c.sort_order ASC;

CREATE OR REPLACE VIEW \`v_capex_summary\` AS
SELECT 
  COUNT(id) AS total_all_items,
  SUM(subtotal) AS gross_capex_total,
  (SELECT COALESCE(value, 0) FROM \`discount_settings\` WHERE \`enabled\` = 1 LIMIT 1) AS global_discount,
  SUM(subtotal) - COALESCE((SELECT CASE WHEN \`type\` = 'percent' THEN (SUM(subtotal) * \`value\` / 100) ELSE \`value\` END FROM \`discount_settings\` WHERE \`enabled\` = 1 LIMIT 1), 0) AS net_capex_total
FROM \`capex_items\`;

CREATE OR REPLACE VIEW \`v_monthly_burn_rate\` AS
SELECT 
  (SELECT SUM(total_per_month) FROM \`staff_salaries\`) AS total_monthly_salaries,
  (SELECT SUM(cost_per_month) FROM \`utility_costs\`) AS total_monthly_utilities,
  (SELECT rent_per_year / 12 FROM \`working_capital_settings\` LIMIT 1) AS monthly_rent_equivalent,
  (SELECT marketing_monthly FROM \`working_capital_settings\` LIMIT 1) AS monthly_marketing,
  (
    COALESCE((SELECT SUM(total_per_month) FROM \`staff_salaries\`), 0) +
    COALESCE((SELECT SUM(cost_per_month) FROM \`utility_costs\`), 0) +
    COALESCE((SELECT rent_per_year / 12 FROM \`working_capital_settings\` LIMIT 1), 0) +
    COALESCE((SELECT marketing_monthly FROM \`working_capital_settings\` LIMIT 1), 0)
  ) AS total_monthly_opex;

SET FOREIGN_KEY_CHECKS = 1;
`;
    return sql;
  }

  const SqlGenerator = {
    generateSqlDump: generateSqlDump,
    escapeSql: escapeSql
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SqlGenerator;
  }
  if (typeof window !== 'undefined') {
    window.SqlGenerator = SqlGenerator;
  }
  root.SqlGenerator = SqlGenerator;
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
