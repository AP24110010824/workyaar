fetch("/api/jobs")
  .then(res => res.json())
  .then(data => {

    let html = "";

    data.forEach(j => {
      html += `<p>${j.title} - ${j.company}</p>`;
    });

    document.getElementById("jobs").innerHTML = html;

  });
