
let AvailResponse = null;
let ContentData = null;

const propertyList = document.getElementById('property-list');
const jsonContainer = document.getElementById('json-container');
const backButton = document.getElementById('back-to-main');

// fetch('API_Resources/AvailResponse.json')
//   .then(response => {
//     if (!response.ok) throw new Error('Network response was not ok');
//     return response.json();
//   })
//   .then(data => {
//     AvailResponse = data;
//     createPropertyList(AvailResponse, propertyList);
//     renderCollapsedJsonList(AvailResponse);
//   })
//   .catch(console.error);

Promise.all([
  fetch('API_Resources/AvailResponse.json').then(res => res.json()),
  fetch('API_Resources/content.json').then(res => res.json())
])
.then(([availData, contentData]) => {
  AvailResponse = availData;
  ContentData = contentData;
  createPropertyList(AvailResponse, propertyList);
  renderCollapsedJsonList(AvailResponse);
})
.catch(console.error);

function clearHighlights() {
  const highlighted = jsonContainer.querySelectorAll('.highlighted');
  highlighted.forEach(el => el.classList.remove('highlighted'));
}

function scrollToTop() {
  jsonContainer.scrollTop = 0;
  propertyList.scrollTop = 0;
}

// function renderJson(jsonData, highlightKey = null) {
function renderJson(jsonData, highlightKey = null, headingText = null) {
  clearHighlights();
  jsonContainer.innerHTML = '';

  if (headingText) {
    const heading = document.createElement('div');
    heading.className = 'json-heading';
    heading.textContent = headingText;
    jsonContainer.appendChild(heading);
  }

  const pre = document.createElement('pre');
  let jsonText = JSON.stringify(jsonData, null, 2);

  // Wrap the key to highlight in a span
  if (highlightKey) {
    const keyRegex = new RegExp(`("${highlightKey}"\\s*:)`, 'g');
    jsonText = jsonText.replace(keyRegex, '<span class="highlighted">$1</span>');
  }

  pre.innerHTML = jsonText;
  pre.classList.add('json-full');
  jsonContainer.appendChild(pre);

  backButton.style.display = 'inline-block';

  // Attach comment logic
  attachJsonCommenting(pre);

  // Scroll *after* it's in DOM
  if (highlightKey) {
    requestAnimationFrame(() => {
      scrollToJsonKey();
    });
  }
}

function renderCollapsedJsonList(properties) {
  jsonContainer.innerHTML = '';
  backButton.style.display = 'none';

  const heading = document.createElement('div');
  heading.className = 'json-heading';
  heading.textContent = 'API Response: Availability';
  jsonContainer.appendChild(heading);

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
      .replace('"rooms": "[...]"', `"rooms": <span class="collapsible collapsed" data-index="${index}" data-key="rooms">[...]</span>`)
      .replace('"links": "{...}"', `"links": <span class="collapsible collapsed" data-index="${index}" data-key="links">{...}</span>`);

    const pre = document.createElement('pre');
    pre.innerHTML = formatted;
    block.appendChild(pre);
    attachJsonCommenting(pre);
    jsonContainer.appendChild(block);
  });

  addToggleListeners();
  
}

function addToggleListeners() {
  // Expand on collapsed labels
  const collapsibles = jsonContainer.querySelectorAll('.collapsible.collapsed');
  collapsibles.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = el.getAttribute('data-index');
      const key = el.getAttribute('data-key');
      const property = AvailResponse[index];
      
      const expandedJson = JSON.stringify(property[key], null, 2);

      // Create collapse toggle label
      const collapseToggle = document.createElement('span');
      collapseToggle.className = 'collapsible expanded';
      collapseToggle.setAttribute('data-index', index);
      collapseToggle.setAttribute('data-key', key);
      collapseToggle.textContent = '[...]';

      // Create pre block for expanded JSON
      const code = document.createElement('pre');
      code.textContent = expandedJson;

      // Wrapper div to hold toggle label + code
      const wrapper = document.createElement('div');
      wrapper.appendChild(collapseToggle);
      wrapper.appendChild(code);

      // Replace the collapsed label with expanded block
      el.replaceWith(wrapper);

      // Attach listener for collapse toggle
      collapseToggle.addEventListener('click', (evt) => {
        evt.stopPropagation();

        // Rebuild collapsed label
        const collapsedLabel = document.createElement('span');
        collapsedLabel.className = 'collapsible collapsed';
        collapsedLabel.setAttribute('data-index', index);
        collapsedLabel.setAttribute('data-key', key);
        collapsedLabel.textContent = key === 'rooms' ? '[...]' : '{...}';

        // Replace expanded block with collapsed label
        wrapper.replaceWith(collapsedLabel);

        // Re-attach expand listener on new collapsed label
        addToggleListeners();
      });
    });
  });
}

// Figure out how to toggle between Availability and Content Responses
function createPropertyList(properties, container) {
  container.innerHTML = ''; // Clear first

  properties.forEach(property => {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property-item';
    propertyDiv.style.display = 'flex';
    propertyDiv.style.alignItems = 'flex-start';
    propertyDiv.style.gap = '12px';

    const contentMatch = ContentData?.find(c => c.property_id === property.property_id);
    const hotelName = contentMatch?.name || `Property ID: ${property.property_id}`;
    const imageUrl = contentMatch?.images?.find(img => img.hero_image)?.links?.['70px']?.href;

    // Left column: Hotel image
      if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl; // <-- this was missing in your update
      img.alt = `${hotelName} image`;
      img.style.width = '140px'; // increased width
      img.style.height = 'auto';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '6px';
      
      propertyDiv.appendChild(img);
    }


    // Middle column: Hotel name + refundable
    const middleCol = document.createElement('div');
    middleCol.style.flex = '0 0 40%'; // reduce width


    const propTitle = document.createElement('h3');
    propTitle.textContent = hotelName;
    propTitle.classList.add('clickable');
    
    propTitle.onclick = () => {
      clearHighlights();
      jsonContainer.innerHTML = '';

      const heading = document.createElement('div');
      heading.className = 'json-heading';
      heading.textContent = 'API Response: Content';
      jsonContainer.appendChild(heading);

      const pre = document.createElement('pre');
      let jsonText = JSON.stringify(contentMatch || property, null, 2);

      if (contentMatch) {
        const keyRegex = new RegExp(`("name"\\s*:)`, 'g');
        jsonText = jsonText.replace(keyRegex, '<span class="highlighted">$1</span>');
      }

      pre.innerHTML = jsonText;
      pre.classList.add('json-full');
      jsonContainer.appendChild(pre);

      backButton.style.display = 'inline-block';
      attachJsonCommenting(pre);
      scrollToTop();
    };


    middleCol.appendChild(propTitle);

    const firstRoom = property.rooms?.[0];
    const firstRate = firstRoom?.rates?.[0];

    if (firstRate?.refundable) {
      const refundP = document.createElement('p');
      refundP.textContent = 'Fully Refundable';
      refundP.className = 'clickable';
      refundP.style.color = '#007A33';
      refundP.style.margin = '4px 0';
      refundP.onclick = () => renderJson(property, 'refundable');
      middleCol.appendChild(refundP);
    }

    propertyDiv.appendChild(middleCol);

    // Right column: nightly + total
    const rightCol = document.createElement('div');
    rightCol.style.flex = '1';
    rightCol.style.alignItems = 'flex-end';
    rightCol.style.minWidth = '100px';


    const nightlyArray = firstRate?.occupancy_pricing?.['2']?.nightly?.[0];
    if (Array.isArray(nightlyArray)) {
      const baseRate = nightlyArray.find(rate => rate.type === 'base_rate');
      if (baseRate) {
        const nightlyP = document.createElement('p');
        nightlyP.innerHTML = `<span class="nightly-link">$${baseRate.value} nightly</span>`;
        nightlyP.classList.add('clickable');
        nightlyP.onclick = () => renderJson(property, 'nightly');
        rightCol.appendChild(nightlyP);
      }
    }

    const totalVal = firstRate?.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.value;
    const currency = firstRate?.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.currency;
    if (totalVal && currency) {
      const totalP = document.createElement('p');
      totalP.innerHTML = `<span class="total-price-link">$${totalVal} total</span>`;
      totalP.classList.add('clickable');
      totalP.onclick = () => renderJson(property, 'totals');
      rightCol.appendChild(totalP);
    }

    propertyDiv.appendChild(rightCol);
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

function scrollToJsonKey() {
  const highlightedEl = jsonContainer.querySelector('.highlighted');
  if (highlightedEl) {
    const containerTop = jsonContainer.getBoundingClientRect().top;
    const elementTop = highlightedEl.getBoundingClientRect().top;
    jsonContainer.scrollTop += elementTop - containerTop - 20;
  }
}


backButton.addEventListener('click', () => {
  createPropertyList(AvailResponse, propertyList);
  renderCollapsedJsonList(AvailResponse);
  scrollToTop();
  backButton.style.display = 'none';
});

function attachJsonCommenting(preElement) {
  preElement.addEventListener('mouseup', () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add a comment...';
    textarea.className = 'comment-box';
    textarea.style.top = `${rect.bottom + window.scrollY}px`;
    textarea.style.left = `${rect.left + window.scrollX}px`;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'comment-submit';
    saveBtn.style.top = `${rect.bottom + window.scrollY}px`;
    saveBtn.style.left = `${rect.left + window.scrollX + 230}px`;

    saveBtn.onclick = () => {
      const span = document.createElement('span');
      span.className = 'highlight-comment';
      span.textContent = selectedText;

      const pin = document.createElement('span');
      pin.textContent = '💬';
      pin.className = 'comment-icon';
      pin.title = textarea.value;

      span.appendChild(pin);
      range.deleteContents();
      range.insertNode(span);

      textarea.remove();
      saveBtn.remove();
      selection.removeAllRanges();
    };

    document.body.appendChild(textarea);
    document.body.appendChild(saveBtn);
  });
}

