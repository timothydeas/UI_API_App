let AvailResponse = null;

const propertyList = document.getElementById('property-list');
const jsonContainer = document.getElementById('json-container');

fetch('API_Resources/AvailResponse.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    AvailResponse = data;
    createPropertyList(AvailResponse, propertyList);
  })
  .catch(console.error);

function clearHighlights() {
  const highlighted = jsonContainer.querySelectorAll('.highlighted');
  highlighted.forEach(el => el.classList.remove('highlighted'));
}

function renderJson(jsonData) {
  clearHighlights();
  jsonContainer.textContent = JSON.stringify(jsonData, null, 2);
}

function scrollToTop() {
  jsonContainer.scrollTop = 0;
}

function createPropertyList(properties, container) {
  properties.forEach(property => {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property-item';

    // Property ID clickable title
    const propTitle = document.createElement('h3');
    propTitle.textContent = `Property ID: ${property.property_id}`;
    propTitle.classList.add('clickable');
    propTitle.onclick = () => {
      renderJson(property);
      scrollToTop();
    };
    propertyDiv.appendChild(propTitle);

    // Grab first room and rate
    const firstRoom = property.rooms?.[0];
    if (firstRoom) {
      const firstRate = firstRoom.rates?.[0];
      if (firstRate) {
        // Refundability clickable
        const refundStatus = document.createElement('p');
        refundStatus.textContent = `Refundable: ${firstRate.refundable ? 'Yes' : 'No'}`;
        refundStatus.style.color = firstRate.refundable ? 'green' : 'red';
        refundStatus.classList.add('clickable');
        refundStatus.onclick = () => {
          renderJson(property);
          highlightJsonKey('refundable');
          scrollToJsonKey('refundable');
        };
        propertyDiv.appendChild(refundStatus);

        // Total Price clickable
        const totalPrice = firstRate.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.value;
        const currency = firstRate.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.currency;
        if (totalPrice && currency) {
          const priceP = document.createElement('p');
          priceP.textContent = `Total Price: ${totalPrice} ${currency}`;
          priceP.classList.add('clickable');
          priceP.onclick = () => {
            renderJson(property);
            highlightJsonKey('totals');
            scrollToJsonKey('totals');
          };
          propertyDiv.appendChild(priceP);
        }

        // Nightly rates summary clickable (first day)
        const nightlyRates = firstRate.occupancy_pricing?.['2']?.nightly?.[0];
        if (nightlyRates) {
          const nightlyText = nightlyRates
            .map(rateItem => `${rateItem.type}: ${rateItem.value} ${rateItem.currency}`)
            .join(', ');
          const nightlyP = document.createElement('p');
          nightlyP.textContent = `Nightly Rate (Day 1): ${nightlyText}`;
          nightlyP.classList.add('clickable');
          nightlyP.onclick = () => {
            renderJson(property);
            highlightJsonKey('nightly');
            scrollToJsonKey('nightly');
          };
          propertyDiv.appendChild(nightlyP);
        }
      }
    }

    container.appendChild(propertyDiv);
  });
}

// Highlight function (basic text search highlighting)
function highlightJsonKey(key) {
  clearHighlights();
  const regex = new RegExp(`"${key}"\\s*:`, 'g');
  const jsonText = jsonContainer.textContent;
  const highlightedText = jsonText.replace(regex, match => `<span class="highlighted">${match}</span>`);
  // Use innerHTML with caution, only because we fully control the content
  jsonContainer.innerHTML = highlightedText;
}

function scrollToJsonKey(key) {
  const highlightedEl = jsonContainer.querySelector('.highlighted');
  if (highlightedEl) {
    const containerTop = jsonContainer.getBoundingClientRect().top;
    const highlightTop = highlightedEl.getBoundingClientRect().top;
    const offset = highlightTop - containerTop;
    jsonContainer.scrollTop += offset - 20; // scroll with some padding
  }
}
