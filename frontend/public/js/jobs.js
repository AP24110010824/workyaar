"use strict";

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.classList.contains("browse-jobs-page") && window.WorkYaarJobs) {
    window.WorkYaarJobs.init();
  }
});
