var AvailResponse = null;


fetch('API_Resources/AvailResponse.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json(); // Parse JSON
  })
  .then(data => {
    console.log(data); // Use your JSON data here
    AvailResponse = data;
  })
  .catch(error => {
    console.error('Error loading JSON:', error);
  });

  function createBody() {
    AvailResponse.forEach(item => {
        const div = document.createElement('div');
        const h2 = document.createElement('h2');
        const p = document.createElement('p');

        h2.textContent = item.title;
        p.textContent = item.description;

        div.appendChild(h2);
        div.appendChild(p);
        container.appendChild(div);
    });

  }