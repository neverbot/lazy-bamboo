// ==UserScript==
// @name         BambooHR Timesheet Fill Month
// @version      1.4
// @description  Fill BambooHR Timesheet month with templates
// @authors      Sergio Conde, neverbot
// @match        https://*.bamboohr.com/employees/timesheet/*
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

"use strict";

const CONTAINER_CLASSLIST =
  "MuiButtonBase-root MuiButton-root jss-r2 jss-r36 jss-r3 jss-r4 MuiButton-contained jss-r10 MuiButton-containedPrimary jss-r11 MuiButton-sizeMedium MuiButton-containedSizeMedium MuiButton-disableElevation css-1fabrok";
// const BUTTON_CLASSLIST = 'fab-Button fab-Button--small fab-Button--width100';

/* Here be dragons */
(async function () {
  const TEMPLATES = {
    // 'default': [{ start: '8:00', end: '15:00' }]
    default: [
      { start: "9:00", end: "14:30" },
      { start: "15:15", end: "18:45" },
    ],
    Fri: [{ start: "10:00", end: "14:00" }],
  };

  GM.setValue("TEMPLATES", TEMPLATES);

  let ENTROPY_MINUTES = 10;

  GM.setValue("ENTROPY_MINUTES", ENTROPY_MINUTES);

  /* Fill Month */
  let btn_fill = document.createElement("button");
  btn_fill.classList.value = CONTAINER_CLASSLIST;
  btn_fill.type = "button";
  // btn_fill.classList.value = BUTTON_CLASSLIST;
  btn_fill.innerText = "(Magic!) Fill Month";

  btn_fill.onclick = function () {
    let tsd = JSON.parse(
      document.getElementById("js-timesheet-data").innerHTML,
    );
    let skipped = [];
    let entries = [];
    let tracking_id = 0;

    for (const [day, details] of Object.entries(tsd.timesheet.dailyDetails)) {
      let date = new Date(day);

      /* Skip weekend */
      if ([0, 6].includes(date.getDay())) {
        continue;
      }

      /* Skip holidays & time off */
      let skip_reasons = [];

      skip_reasons.push(
        ...details.holidays.map(
          (h) => `${h.name.trim()} (${h.paidHours} hours)`,
        ),
      );
      skip_reasons.push(
        ...details.timeOff.map(
          (t) => `${t.type.trim()} (${t.amount} ${t.unit})`,
        ),
      );

      if (skip_reasons.length > 0) {
        skipped.push(`${day}: ${skip_reasons.join(", ")}`);
        continue;
      }

      /* Get the working time slots for the dow */
      let dow = date.toLocaleDateString("en-US", { weekday: "short" });
      let slots = TEMPLATES["default"];

      if (TEMPLATES.hasOwn(dow)) {
        slots = TEMPLATES[dow];
      }

      /* Generate the entries for this day */
      let minute_diff = [...Array(slots.length)].map(() =>
        Math.ceil(Math.random() * ENTROPY_MINUTES),
      );

      for (const [idx, slot] of slots.entries()) {
        tracking_id += 1;

        let start = new Date(`${day} ${slot.start}`);
        start.setMinutes(start.getMinutes() + minute_diff[idx]);

        let end = new Date(`${day} ${slot.end}`);
        end.setMinutes(
          end.getMinutes() + minute_diff[minute_diff.length - 1 - idx],
        );

        entries.push({
          id: null,
          trackingId: tracking_id,
          employeeId: unsafeWindow.currentlyEditingEmployeeId,
          date: day,
          start: `${start.getHours()}:${("0" + start.getMinutes()).slice(-2)}`,
          end: `${end.getHours()}:${("0" + end.getMinutes()).slice(-2)}`,
          note: "",
        });
      }
    }

    fetch(`${window.location.origin}/timesheet/clock/entries`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-csrf-token": unsafeWindow.CSRF_TOKEN,
      },
      body: JSON.stringify({ entries: entries }),
    })
      .then((data) => {
        if (data.status == 200) {
          alert(
            `Created ${entries.length} entries.\n\nSkipped days:\n${skipped.join("\n")}`,
          );
          location.reload();
        } else {
          data
            .text()
            .then((t) =>
              alert(
                `Request error!\nHTTP Code: ${data.status}\nResponse:\n${t}`,
              ),
            );
        }
      })
      .catch((err) => alert(`Fetch error!\n\n${err}`));

    return false;
  };

  /* Delete Month */
  let btn_del = document.createElement("button");
  btn_del.type = "button";
  btn_del.classList.value = CONTAINER_CLASSLIST;
  // btn_del.classList.value = BUTTON_CLASSLIST;
  btn_del.innerText = "(Magic!) Delete Month";

  btn_del.onclick = function () {
    let tsd = JSON.parse(
      document.getElementById("js-timesheet-data").innerHTML,
    );
    let entries = [];

    /* Grab all entries ids */
    for (const [, details] of Object.entries(tsd.timesheet.dailyDetails)) {
      for (const entry of details.clockEntries) {
        entries.push(entry.id);
      }
    }

    fetch(`${window.location.origin}/timesheet/clock/entries`, {
      method: "DELETE",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "x-csrf-token": unsafeWindow.CSRF_TOKEN,
      },
      body: JSON.stringify({ entries: entries }),
    })
      .then((data) => {
        if (data.status == 200) {
          alert(`Deleted ${entries.length} entries.`);
          location.reload();
        } else {
          data
            .text()
            .then((t) =>
              alert(
                `Request error!\nHTTP Code: ${data.status}\nResponse:\n${t}`,
              ),
            );
        }
      })
      .catch((err) => alert(`Fetch error!\n\n${err}`));

    return false;
  };

  /* Add buttons */
  let clockInButton = document.querySelector(
    '[data-bi-id="my-info-timesheet-clock-in-button"]',
  );
  clockInButton.parentNode.insertBefore(btn_fill, clockInButton);
  clockInButton.parentNode.insertBefore(btn_del, clockInButton);
  clockInButton.parentNode.style["flex-direction"] = "column";
})();
