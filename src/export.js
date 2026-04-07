// ═══════════════════════════════════════════════
// CSV EXPORT
// ═══════════════════════════════════════════════

function downloadCSV(filename, rows) {
  if (!rows.length) { alert('No data to export for current filter selection.'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row => headers.map(h => {
      const v = row[h] ?? '';
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
    }).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTab1CSV() {
  const fans = filterFans(STATE.tab1, 'tab1');
  const rows = fans.map(fan => ({
    adw_fan_id:     fan.adw_fan_id,
    handle:         fan.adw_handle,
    deposits:       fan.adw_deposits,
    withdrawals:    fan.adw_withdrawals,
    wager_count:    fan.adw_wager_count,
    channel:        fan.adw_channel,
    account_status: fan.adw_account_status,
    days_active:    fan.adw_days_active,
    venue:          fan.adw_venue,
    home_state:     fan.adw_state,
  }));
  downloadCSV('adw_wagering_export.csv', rows);
}

function exportTab2CSV() {
  const fans = filterFans(STATE.tab2, 'tab2');
  const rows = fans.map(fan => ({
    ticketing_fan_id:  fan.ticketing_fan_id,
    tickets_purchased: fan.tickets_purchased,
    events_attended:   fan.events_attended,
    gross_spend:       fan.ticket_spend,
    seat_category:     fan.seat_category,
    repeat_buyer:      fan.repeat_buyer ? 'Y' : 'N',
    home_state:        fan.ticket_state,
    venue:             fan.ticket_venue,
  }));
  downloadCSV('ticket_sales_export.csv', rows);
}

function exportTab3CSV() {
  const fans = filterFans(STATE.tab3, 'tab3');
  const rows = fans.map(fan => ({
    fnb_fan_id:            fan.fnb_fan_id,
    total_fnb_spend:       fan.fnb_spend,
    transaction_count:     fan.fnb_transactions,
    avg_transaction_value: fan.fnb_avg_transaction,
    top_category:          fan.fnb_top_category,
    attach_flag:           fan.fnb_attach_flag ? 'Y' : 'N',
    visit_count:           fan.fnb_visit_count,
    venue:                 fan.fnb_venue,
  }));
  downloadCSV('fnb_export.csv', rows);
}

function exportTab4CSV() {
  const fans = filterFans(STATE.tab4, 'tab4').filter(fan => fan.global_fan_id);
  const rows = fans.map(fan => ({
    global_fan_id:             fan.global_fan_id,
    adw_handle:                fan.adw_handle ?? '',
    adw_wager_count:           fan.adw_wager_count ?? '',
    adw_account_status:        fan.adw_account_status ?? '',
    ticket_spend:              fan.ticket_spend ?? '',
    tickets_purchased:         fan.tickets_purchased ?? '',
    events_attended:           fan.events_attended ?? '',
    fnb_spend:                 fan.fnb_spend ?? '',
    fnb_transactions:          fan.fnb_transactions ?? '',
    total_cross_channel_spend: fan.total_cross_channel_spend,
    linked_sources:            fan.linked_sources,
    match_confidence_score:    fan.match_confidence_score ?? '',
    home_state:                fan.home_state,
    primary_venue:             fan.primary_venue,
  }));
  downloadCSV('fan_identity_export.csv', rows);
}

document.getElementById('t1-export').addEventListener('click', exportTab1CSV);
document.getElementById('t2-export').addEventListener('click', exportTab2CSV);
document.getElementById('t3-export').addEventListener('click', exportTab3CSV);
document.getElementById('t4-export').addEventListener('click', exportTab4CSV);
