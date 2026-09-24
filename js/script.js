
  var folds = document.querySelectorAll('details');
  window.addEventListener('beforeprint', function () {
    folds.forEach(function (d) { d.dataset.was = d.open ? '1' : '0'; d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    folds.forEach(function (d) { if (d.dataset.was === '0') d.open = false; });
  });

  document.querySelectorAll('.shot img').forEach(function (img) {
    img.addEventListener('error', function () {
      var shot = img.closest('.shot');
      if (shot) { shot.classList.add('shot--empty'); img.remove(); }
    });
  });

  document.getElementById('ics').addEventListener('click', function () {
    var ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Being ME Canada//2026 Conference//EN',
      'BEGIN:VEVENT','UID:beingme-2026-toronto@being-me.org',
      'DTSTAMP:20260101T000000Z',
      'DTSTART;TZID=America/Toronto:20261025T090000',
      'DTEND;TZID=America/Toronto:20261025T210000',
      'SUMMARY:Being ME 2026 Toronto Conference - A Life by His Design',
      'LOCATION:Grand Victorian Convention Centre, 175 Derry Road E, Mississauga, ON L5T 2Z7',
      'DESCRIPTION:Registration and full details at https://attendbm.com/',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    var url = URL.createObjectURL(new Blob([ics], {type:'text/calendar'}));
    var a = document.createElement('a');
    a.href = url; a.download = 'being-me-2026.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  });
