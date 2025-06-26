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
    renderCollapsedJsonList(data); // show summary list on load
  })
  .catch(console.error);

function clearHighlights() {
  const highlighted = jsonContainer.querySelectorAll('.highlighted');
  highlighted.forEach(el => el.classList.remove('highlighted'));
}

function scrollToTop() {
  jsonContainer.scrollTop = 0;
}

function renderJson(jsonData) {
  clearHighlights();
  jsonContainer.textContent = JSON.stringify(jsonData, null, 2);
  scrollToTop();
}

function renderCollapsedJsonList(properties) {
  jsonContainer.innerHTML = '';
  properties.forEach((property, index) => {
    const block = document.createElement('div');
    block.className = 'json-preview-block';

    const shortJson = {
      property_id: property.property_id,
      status: property.status,
      rooms: '[...]',
      links: '{...}',
      score: property.score
    };

    let formatted = JSON.stringify(shortJson, null, 2);
    formatted = formatted
      .replace('"rooms": "[...]"', `"rooms": <span class="collapsible collapsed" data-index="${index}" data-key="rooms">[...click to expand]</span>`)
      .replace('"links": "{...}"', `"links": <span class="collapsible collapsed" data-index="${index}" data-key="links">{...click to expand}</span>`);

    const pre = document.createElement('pre');
    pre.innerHTML = formatted;
    block.appendChild(pre);
    jsonContainer.appendChild(block);
  });

  addToggleListeners();
}

function addToggleListeners() {
  const collapsibles = jsonContainer.querySelectorAll('.collapsible');
  collapsibles.forEach(el => {
    el.addEventListener('click', () => {
      const index = el.getAttribute('data-index');
      const key = el.getAttribute('data-key');
      const property = AvailResponse[index];
      const isCollapsed = el.classList.contains('collapsed');

      if (isCollapsed) {
        // Expand
        el.classList.remove('collapsed');
        el.classList.add('expanded');

        const wrapper = document.createElement('div');
        wrapper.classList.add('expanded-wrapper');

        const collapseLine = document.createElement('div');
        collapseLine.classList.add('collapse-line', 'clickable');
        collapseLine.textContent = '[...click to collapse]';

        collapseLine.onclick = () => {
          wrapper.replaceWith(el);
          el.classList.remove('expanded');
          el.classList.add('collapsed');
          el.textContent = Array.isArray(property[key]) ? '[...click to expand]' : '{...click to expand}';
          addToggleListeners();
        };

        const expandedJsonPre = document.createElement('pre');
        expandedJsonPre.textContent = JSON.stringify(property[key], null, 2);
        expandedJsonPre.classList.add('expanded-json');

        wrapper.appendChild(collapseLine);
        wrapper.appendChild(expandedJsonPre);

        el.replaceWith(wrapper);
      }
    });
  });
}

function createPropertyList(properties, container) {
  properties.forEach(property => {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property-item';

    const propTitle = document.createElement('h3');
    propTitle.textContent = `Property ID: ${property.property_id}`;
    propTitle.classList.add('clickable');
    propTitle.onclick = () => {
      renderJson(property);
      scrollToTop();
    };
    propertyDiv.appendChild(propTitle);

    const firstRoom = property.rooms?.[0];
    if (firstRoom) {
      const firstRate = firstRoom.rates?.[0];
      if (firstRate) {
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

function highlightJsonKey(key) {
  clearHighlights();
  const regex = new RegExp(`"${key}"\\s*:`, 'g');
  const jsonText = jsonContainer.textContent;
  const highlightedText = jsonText.replace(regex, match => `<span class="highlighted">${match}</span>`);
  jsonContainer.innerHTML = highlightedText;
}

function scrollToJsonKey(key) {
  const highlightedEl = jsonContainer.querySelector('.highlighted');
  if (highlightedEl) {
    const containerTop = jsonContainer.getBoundingClientRect().top;
    const highlightTop = highlightedEl.getBoundingClientRect().top;
    const offset = highlightTop - containerTop;
    jsonContainer.scrollTop += offset - 20;
  }
}
