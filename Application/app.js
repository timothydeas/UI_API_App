let AvailResponse = null;
let ContentData = null;

const propertyList = document.getElementById('property-list');
const jsonContainer = document.getElementById('json-container');
const backButton = document.getElementById('back-to-main');

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

// --- Tab bar event logic ---

function renderCollapsedJsonList(properties, headingOverride) {
  jsonContainer.innerHTML = '';
  backButton.style.display = 'none';

  const heading = document.createElement('div');
  heading.className = 'json-heading';
  heading.textContent = headingOverride || 'Availability API Response';
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

    // Build preview with clickable brackets inside the preview
    let formatted = JSON.stringify(shortJson, null, 2);
    // Create unique placeholders
    formatted = formatted
      .replace('"rooms": "[...]"', '"rooms": __ROOMS_PLACEHOLDER__')
      .replace('"links": "{...}"', '"links": __LINKS_PLACEHOLDER__');

    // Create pre and insert placeholders
    const pre = document.createElement('pre');
    pre.innerHTML = formatted;
    pre.setAttribute('data-json-path', `root[${index}]`);
    block.appendChild(pre);
    attachJsonCommenting(pre);

    // Create and insert clickable bracket elements for rooms
    const roomsCollapsed = document.createElement('span');
    roomsCollapsed.className = 'open-bracket collapsed array';
    roomsCollapsed.textContent = '[...]';
    roomsCollapsed.style.cursor = 'pointer';
    roomsCollapsed.setAttribute('data-key', 'rooms');
    roomsCollapsed.style.color = '#4da6ff';
    roomsCollapsed.style.fontWeight = 'bold';
    roomsCollapsed.style.userSelect = 'none';

    const roomsExpanded = document.createElement('span');
    roomsExpanded.className = 'open-bracket expanded array';
    roomsExpanded.textContent = '[';
    roomsExpanded.style.cursor = 'pointer';
    roomsExpanded.setAttribute('data-key', 'rooms');
    roomsExpanded.style.color = '#4da6ff';
    roomsExpanded.style.fontWeight = 'bold';
    roomsExpanded.style.userSelect = 'none';
    roomsExpanded.style.display = 'none';

    // Insert collapsed by default
    pre.innerHTML = pre.innerHTML.replace('__ROOMS_PLACEHOLDER__', roomsCollapsed.outerHTML);

    // Create expanded section for rooms
    const expandedRooms = document.createElement('pre');
    expandedRooms.style.display = 'none';
    expandedRooms.setAttribute('data-json-path', `root[${index}].rooms`);
    expandedRooms.textContent = JSON.stringify(property.rooms, null, 2);
    attachJsonCommenting(expandedRooms);
    block.appendChild(roomsExpanded);
    block.appendChild(expandedRooms);

    // Create and insert clickable bracket elements for links
    const linksCollapsed = document.createElement('span');
    linksCollapsed.className = 'open-bracket collapsed object';
    linksCollapsed.textContent = '{...}';
    linksCollapsed.style.cursor = 'pointer';
    linksCollapsed.setAttribute('data-key', 'links');
    linksCollapsed.style.color = '#4da6ff';
    linksCollapsed.style.fontWeight = 'bold';
    linksCollapsed.style.userSelect = 'none';

    const linksExpanded = document.createElement('span');
    linksExpanded.className = 'open-bracket expanded object';
    linksExpanded.textContent = '{';
    linksExpanded.style.cursor = 'pointer';
    linksExpanded.setAttribute('data-key', 'links');
    linksExpanded.style.color = '#4da6ff';
    linksExpanded.style.fontWeight = 'bold';
    linksExpanded.style.userSelect = 'none';
    linksExpanded.style.display = 'none';

    pre.innerHTML = pre.innerHTML.replace('__LINKS_PLACEHOLDER__', linksCollapsed.outerHTML);

    // Create expanded section for links
    const expandedLinks = document.createElement('pre');
    expandedLinks.style.display = 'none';
    expandedLinks.setAttribute('data-json-path', `root[${index}].links`);
    expandedLinks.textContent = JSON.stringify(property.links, null, 2);
    attachJsonCommenting(expandedLinks);
    block.appendChild(linksExpanded);
    block.appendChild(expandedLinks);

    jsonContainer.appendChild(block);
  });

  addToggleListeners();
  
}

function addToggleListeners() {
  // Expand/collapse using show/hide
  const blocks = jsonContainer.querySelectorAll('.json-preview-block');
  blocks.forEach(block => {
    // ROOMS
    const pre = block.querySelector('pre[data-json-path^="root["]');
    const roomsCollapsed = pre?.querySelector('.open-bracket.collapsed.array[data-key="rooms"]');
    const roomsExpanded = block.querySelector('.open-bracket.expanded.array[data-key="rooms"]');
    const expandedRooms = block.querySelector('pre[data-json-path$=".rooms"]');
    if (roomsCollapsed && roomsExpanded && expandedRooms) {
      roomsCollapsed.addEventListener('click', (e) => {
        e.stopPropagation();
        roomsCollapsed.style.display = 'none';
        roomsExpanded.style.display = 'inline';
        expandedRooms.style.display = 'block';
        restoreCommentHighlights(expandedRooms);
      });
      roomsExpanded.addEventListener('click', (e) => {
        e.stopPropagation();
        roomsExpanded.style.display = 'none';
        expandedRooms.style.display = 'none';
        roomsCollapsed.style.display = 'inline';
      });
    }
    // LINKS
    const linksCollapsed = pre?.querySelector('.open-bracket.collapsed.object[data-key="links"]');
    const linksExpanded = block.querySelector('.open-bracket.expanded.object[data-key="links"]');
    const expandedLinks = block.querySelector('pre[data-json-path$=".links"]');
    if (linksCollapsed && linksExpanded && expandedLinks) {
      linksCollapsed.addEventListener('click', (e) => {
        e.stopPropagation();
        linksCollapsed.style.display = 'none';
        linksExpanded.style.display = 'inline';
        expandedLinks.style.display = 'block';
        restoreCommentHighlights(expandedLinks);
      });
      linksExpanded.addEventListener('click', (e) => {
        e.stopPropagation();
        linksExpanded.style.display = 'none';
        expandedLinks.style.display = 'none';
        linksCollapsed.style.display = 'inline';
      });
    }
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
      // Add yellow border to this property-item, remove from others
      document.querySelectorAll('.property-item').forEach(item => item.style.boxShadow = 'none');
      propertyDiv.style.boxShadow = '0 0 0 3px yellow';
      // Switch tab UI to Content
      const tabAvail = document.getElementById('tab-availability');
      const tabContent = document.getElementById('tab-content');
      if (tabAvail && tabContent) {
        tabAvail.classList.remove('active');
        tabContent.classList.add('active');
      }
      clearHighlights();
      jsonContainer.innerHTML = '';
      const heading = document.createElement('div');
      heading.className = 'json-heading';
      heading.textContent = 'Content API Response';
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
      refundP.onclick = () => {
        document.querySelectorAll('.property-item').forEach(item => item.style.boxShadow = 'none');
        propertyDiv.style.boxShadow = '0 0 0 3px yellow';
        // Switch tab UI to Availability
        const tabAvail = document.getElementById('tab-availability');
        const tabContent = document.getElementById('tab-content');
        if (tabAvail && tabContent) {
          tabAvail.classList.add('active');
          tabContent.classList.remove('active');
        }
        renderJson(property, 'refundable');
      };
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
        nightlyP.onclick = () => {
          document.querySelectorAll('.property-item').forEach(item => item.style.boxShadow = 'none');
          propertyDiv.style.boxShadow = '0 0 0 3px yellow';
          // Switch tab UI to Availability
          const tabAvail = document.getElementById('tab-availability');
          const tabContent = document.getElementById('tab-content');
          if (tabAvail && tabContent) {
            tabAvail.classList.add('active');
            tabContent.classList.remove('active');
          }
          // Always reset jsonContainer background and color
          jsonContainer.style.background = '';
          jsonContainer.style.color = '';
          renderJson(property, 'nightly');
        };
        rightCol.appendChild(nightlyP);
      }
    }

    const totalVal = firstRate?.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.value;
    const currency = firstRate?.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency?.currency;
    if (totalVal && currency) {
      const totalP = document.createElement('p');
      totalP.innerHTML = `<span class="total-price-link">$${totalVal} total</span>`;
      totalP.classList.add('clickable');
      totalP.onclick = () => {
        document.querySelectorAll('.property-item').forEach(item => item.style.boxShadow = 'none');
        propertyDiv.style.boxShadow = '0 0 0 3px yellow';
        // Switch tab UI to Availability
        const tabAvail = document.getElementById('tab-availability');
        const tabContent = document.getElementById('tab-content');
        if (tabAvail && tabContent) {
          tabAvail.classList.add('active');
          tabContent.classList.remove('active');
        }
        // Always reset jsonContainer background and color
        jsonContainer.style.background = '';
        jsonContainer.style.color = '';
        renderJson(property, 'totals');
      };
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
  // Ensure Availability tab is selected
  const tabAvail = document.getElementById('tab-availability');
  const tabContent = document.getElementById('tab-content');
  if (tabAvail && tabContent) {
    tabAvail.classList.add('active');
    tabContent.classList.remove('active');
  }
});



// --- Kindle-style annotation system ---
let jsonComments = [];
const COMMENTS_STORAGE_KEY = 'jsonComments';

function getCurrentTabSource() {
  const tabAvail = document.getElementById('tab-availability');
  const tabContent = document.getElementById('tab-content');
  if (tabAvail && tabAvail.classList.contains('active')) return 'Availability';
  if (tabContent && tabContent.classList.contains('active')) return 'Content';
  return 'Unknown';
}

function saveCommentsToStorage() {
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(jsonComments));
}

function loadCommentsFromStorage() {
  const data = localStorage.getItem(COMMENTS_STORAGE_KEY);
  jsonComments = data ? JSON.parse(data) : [];
}

function showKindleToolbar(rect, onComment, onCopy) {
  removeKindleToolbar();
  const toolbar = document.createElement('div');
  toolbar.className = 'kindle-toolbar';
  toolbar.style.top = `${rect.top + window.scrollY - 8}px`;
  toolbar.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;

  const commentBtn = document.createElement('button');
  commentBtn.className = 'toolbar-btn';
  commentBtn.textContent = 'Comment';
  commentBtn.onclick = onComment;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'toolbar-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.onclick = onCopy;

  toolbar.appendChild(commentBtn);
  toolbar.appendChild(copyBtn);
  document.body.appendChild(toolbar);
}

function removeKindleToolbar() {
  const tb = document.querySelector('.kindle-toolbar');
  if (tb) tb.remove();
}

function showToolbarNotification(message) {
  const tb = document.querySelector('.kindle-toolbar');
  if (!tb) return;
  tb.innerHTML = `<span style="color: #fff;">${message}</span>`;
  setTimeout(removeKindleToolbar, 1200);
}

function getSelectionContext(preElement, range) {
  // Get a unique context for the selection: use the path to the pre, and the offset in the text
  // This is a simple but robust way to distinguish between similar text in different places
  // Use data-json-path for context uniqueness
  const jsonPath = preElement.getAttribute('data-json-path') || '';
  // Get start offset in pre's textContent
  let startOffset = 0;
  if (range && range.startContainer && preElement.contains(range.startContainer)) {
    const walker = document.createTreeWalker(preElement, NodeFilter.SHOW_TEXT, null, false);
    let found = false;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node === range.startContainer) {
        startOffset += range.startOffset;
        found = true;
        break;
      } else {
        startOffset += node.textContent.length;
      }
    }
    if (!found) startOffset = 0;
  }
  return jsonPath + ':' + startOffset;
}

function attachJsonCommenting(preElement) {
  preElement.addEventListener('mousedown', removeKindleToolbar);
  preElement.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      if (!selectedText || !selection.rangeCount) return;
      // Only allow selection within this pre
      if (!preElement.contains(selection.anchorNode) || !preElement.contains(selection.focusNode)) return;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const contextId = getSelectionContext(preElement, range);

      showKindleToolbar(rect,
        // onComment
        () => {
          removeKindleToolbar();
          const note = prompt('Add a comment for:\n"' + selectedText + '"');
          if (!note) return;
          // Save comment with unique contextId
          const comment = {
            text: selectedText,
            note,
            timestamp: Date.now(),
            context: preElement.innerText.slice(0, 100),
            source: getCurrentTabSource(),
            contextId
          };
          jsonComments.push(comment);
          saveCommentsToStorage();
          highlightSelection(range, comment, contextId);
          selection.removeAllRanges();
        },
        // onCopy
        () => {
          navigator.clipboard.writeText(selectedText).then(() => {
            showToolbarNotification('Copied to clipboard!');
          });
        }
      );
    }, 0);
  });
}

function highlightSelection(range, comment, contextId) {
  const span = document.createElement('span');
  span.className = 'highlight-comment';
  span.style.background = '#2196f3';
  span.style.color = '#fff';
  span.title = comment.note;
  span.dataset.timestamp = comment.timestamp;
  span.dataset.contextId = contextId;
  span.textContent = comment.text;
  // Optionally add a comment icon
  const pin = document.createElement('span');
  pin.textContent = '\ud83d\udcac';
  pin.className = 'comment-icon';
  pin.title = comment.note;
  span.appendChild(pin);
  range.deleteContents();
  range.insertNode(span);
}

function restoreCommentHighlights(preElement) {
  if (!jsonComments.length) return;
  // Remove all highlight-comment spans before restoring
  removeAllHighlightsInPre(preElement);
  // For each comment, try to find and highlight the text in the pre, only if contextId matches
  const preJsonPath = preElement.getAttribute('data-json-path') || '';
  jsonComments.forEach(comment => {
    if (!comment.contextId) return;
    const commentPath = comment.contextId.split(':')[0];
    if (commentPath !== preJsonPath) return;
    // Use a robust search for the exact text (multi-line safe)
    const textToFind = comment.text;
    const contextText = preElement.innerText;
    let startIdx = contextText.indexOf(textToFind);
    if (startIdx !== -1) {
      // Find the start and end offsets in the HTML
      let charCount = 0;
      let startNode = null, endNode = null, startOffset = 0, endOffset = 0;
      const walker = document.createTreeWalker(preElement, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!startNode && charCount + node.textContent.length > startIdx) {
          startNode = node;
          startOffset = startIdx - charCount;
        }
        if (!endNode && charCount + node.textContent.length >= startIdx + textToFind.length) {
          endNode = node;
          endOffset = startIdx + textToFind.length - charCount;
          break;
        }
        charCount += node.textContent.length;
      }
      if (startNode && endNode) {
        // Create a range and wrap it
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        const span = document.createElement('span');
        span.className = 'highlight-comment';
        span.style.background = '#2196f3';
        span.style.color = '#fff';
        span.title = comment.note;
        span.dataset.timestamp = comment.timestamp;
        span.dataset.contextId = comment.contextId;
        span.textContent = range.toString();
        const pin = document.createElement('span');
        pin.textContent = '\ud83d\udcac';
        pin.className = 'comment-icon';
        pin.title = comment.note;
        span.appendChild(pin);
        range.deleteContents();
        range.insertNode(span);
      }
    }
  });
}

// Remove all highlight-comment spans in a pre block
function removeAllHighlightsInPre(pre) {
  if (!pre) return;
  // Replace all highlight-comment spans with their text content (removes icon too)
  const walker = document.createTreeWalker(pre, NodeFilter.SHOW_ELEMENT, null, false);
  let nodesToRemove = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.classList && node.classList.contains('highlight-comment')) {
      nodesToRemove.push(node);
    }
  }
  nodesToRemove.forEach(node => {
    const parent = node.parentNode;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
  });
  // Remove any .comment-icon spans that are not inside a .highlight-comment span (orphan icons)
  const orphanIcons = Array.from(pre.querySelectorAll('.comment-icon')).filter(icon => !icon.closest('.highlight-comment'));
  orphanIcons.forEach(icon => icon.remove());
}

// --- Comments Tab Logic ---
function renderCommentsTab() {
  const jsonContainer = document.getElementById('json-container');
  jsonContainer.innerHTML = '';
  // Distinct style for comments view (light blue background)
  jsonContainer.style.background = '#e3f2fd';
  jsonContainer.style.color = '#222';
  jsonContainer.style.fontFamily = 'Arial, sans-serif';
  jsonContainer.style.fontSize = '16px';
  jsonContainer.style.padding = '32px 24px';

  const heading = document.createElement('div');
  heading.className = 'json-heading';
  heading.style.fontSize = '2rem';
  heading.style.marginBottom = '24px';
  heading.textContent = 'All Comments';
  jsonContainer.appendChild(heading);
  if (!jsonComments.length) {
    const p = document.createElement('p');
    p.textContent = 'No comments yet.';
    p.style.color = '#888';
    jsonContainer.appendChild(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.padding = '0';
  jsonComments.forEach(comment => {
    const li = document.createElement('li');
    li.style.marginBottom = '28px';
    li.style.background = '#fff';
    li.style.borderRadius = '8px';
    li.style.padding = '16px 18px';
    li.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    li.innerHTML = `<span style="background:#2196f3;color:#fff;padding:2px 6px;border-radius:3px;">${comment.text}<span class='comment-icon' style='color:#fff;font-size:18px;margin-left:5px;' title='Comment'>💬</span></span><br><span class='comments-list-note' style="color:#222;font-size:17px;">${comment.note}</span><br><span style="font-size:13px;color:#888;">${new Date(comment.timestamp).toLocaleString()} | <b>${comment.source} API Response</b></span>`;
    ul.appendChild(li);
  });
  jsonContainer.appendChild(ul);
}

// --- Tab bar event logic update ---

document.addEventListener('DOMContentLoaded', () => {
  loadCommentsFromStorage();
  const tabAvail = document.getElementById('tab-availability');
  const tabContent = document.getElementById('tab-content');
  const tabComments = document.getElementById('tab-comments');
  if (tabAvail && tabContent && tabComments) {
    // Set initial state: Availability tab active, Content/Comments tab inactive
    tabAvail.classList.add('active');
    tabContent.classList.remove('active');
    tabComments.classList.remove('active');

    // Remove previous event listeners by replacing nodes (ensures no duplicate handlers)
    const tabAvailClone = tabAvail.cloneNode(true);
    const tabContentClone = tabContent.cloneNode(true);
    const tabCommentsClone = tabComments.cloneNode(true);
    tabAvail.parentNode.replaceChild(tabAvailClone, tabAvail);
    tabContent.parentNode.replaceChild(tabContentClone, tabContent);
    tabComments.parentNode.replaceChild(tabCommentsClone, tabComments);

    tabAvailClone.addEventListener('click', () => {
      tabAvailClone.classList.add('active');
      tabContentClone.classList.remove('active');
      tabCommentsClone.classList.remove('active');
      // Reset tab backgrounds and text color
      tabAvailClone.style.background = '';
      tabContentClone.style.background = '';
      tabCommentsClone.style.background = '';
      tabAvailClone.style.color = '';
      tabContentClone.style.color = '';
      tabCommentsClone.style.color = '';
      jsonContainer.style.background = '';
      jsonContainer.style.color = '';
      renderCollapsedJsonList(AvailResponse, 'Availability API Response');
      backButton.style.display = 'none';
    });
    tabContentClone.addEventListener('click', () => {
      tabContentClone.classList.add('active');
      tabAvailClone.classList.remove('active');
      tabCommentsClone.classList.remove('active');
      // Reset tab backgrounds and text color
      tabAvailClone.style.background = '';
      tabContentClone.style.background = '';
      tabCommentsClone.style.background = '';
      tabAvailClone.style.color = '';
      tabContentClone.style.color = '';
      tabCommentsClone.style.color = '';
      jsonContainer.style.background = '';
      jsonContainer.style.color = '';
      // Show the Content JSON view as in property title click
      jsonContainer.innerHTML = '';
      const heading = document.createElement('div');
      heading.className = 'json-heading';
      heading.textContent = 'Content API Response';
      jsonContainer.appendChild(heading);
      const pre = document.createElement('pre');
      let jsonText = JSON.stringify(ContentData, null, 2);
      pre.innerHTML = jsonText;
      pre.classList.add('json-full');
      jsonContainer.appendChild(pre);
      backButton.style.display = 'inline-block';
      attachJsonCommenting(pre);
      restoreCommentHighlights(pre);
      scrollToTop();
    });
    tabCommentsClone.addEventListener('click', () => {
      tabCommentsClone.classList.add('active');
      tabAvailClone.classList.remove('active');
      tabContentClone.classList.remove('active');
      // Set Comments tab and container background and text color
      tabAvailClone.style.background = '';
      tabContentClone.style.background = '';
      tabCommentsClone.style.background = '#e6f2ff';
      tabAvailClone.style.color = '';
      tabContentClone.style.color = '';
      tabCommentsClone.style.color = '';
      jsonContainer.style.background = '#e6f2ff';
      jsonContainer.style.color = '#222';
      renderCommentsTab();
      backButton.style.display = 'none';
    });
    // Show availability collapsed view by default
    renderCollapsedJsonList(AvailResponse);
    backButton.style.display = 'none';
  }
});

// Patch renderJson and renderCollapsedJsonList to restore highlights
const origRenderJson = renderJson;
renderJson = function(jsonData, highlightKey = null, headingText = null) {
  origRenderJson(jsonData, highlightKey, headingText);
  // After rendering, restore highlights
  const pre = document.querySelector('#json-container pre');
  if (pre) restoreCommentHighlights(pre);
};

const origRenderCollapsedJsonList = renderCollapsedJsonList;
renderCollapsedJsonList = function(properties) {
  origRenderCollapsedJsonList(properties);
  // After rendering, reload comments and restore highlights for each pre
  loadCommentsFromStorage();
  document.querySelectorAll('#json-container pre').forEach(pre => restoreCommentHighlights(pre));
  // Re-attach expand/collapse listeners (since innerHTML replacement removes them)
  addToggleListeners();
};

