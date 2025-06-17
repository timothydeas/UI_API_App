fetch('API_Resources/AvailResponse.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    AvailResponse = data;
    const container = document.getElementById('property-list');
    createPropertyList(AvailResponse, container);
  })
  .catch(console.error);

function createPropertyList(properties, container) {
  const jsonViewer = document.getElementById('json-viewer');

  properties.forEach(property => {
    const propertyDiv = document.createElement('div');
    propertyDiv.className = 'property-item';
    propertyDiv.style.cursor = 'pointer';

    // Click anywhere on property = show full JSON
    propertyDiv.addEventListener('click', () => {
      jsonViewer.textContent = JSON.stringify(property, null, 2);
    });

    const propTitle = document.createElement('h3');
    propTitle.textContent = `Property ID: ${property.property_id}`;
    propertyDiv.appendChild(propTitle);

    const firstRoom = property.rooms?.[0];
    if (firstRoom) {
      const firstRate = firstRoom.rates?.[0];
      if (firstRate) {
        // Refundability (clickable)
        const refundStatus = document.createElement('p');
        const isRefundable = firstRate.refundable;
        refundStatus.textContent = `Refundable: ${isRefundable ? 'Yes' : 'No'}`;
        refundStatus.style.color = isRefundable ? 'green' : 'red';
        refundStatus.style.cursor = 'pointer';
        refundStatus.addEventListener('click', e => {
          e.stopPropagation(); // prevent parent click
          jsonViewer.textContent = JSON.stringify({ refundable: firstRate.refundable }, null, 2);
        });
        propertyDiv.appendChild(refundStatus);

        // Total Price (clickable)
        const totalPriceData = firstRate.occupancy_pricing?.['2']?.totals?.inclusive?.billable_currency;
        if (totalPriceData?.value && totalPriceData?.currency) {
          const priceP = document.createElement('p');
          priceP.textContent = `Total Price: ${totalPriceData.value} ${totalPriceData.currency}`;
          priceP.style.cursor = 'pointer';
          priceP.addEventListener('click', e => {
            e.stopPropagation();
            jsonViewer.textContent = JSON.stringify(
              { total_price_inclusive: totalPriceData },
              null,
              2
            );
          });
          propertyDiv.appendChild(priceP);
        }

        // Nightly rates (clickable)
        const nightlyRates = firstRate.occupancy_pricing?.['2']?.nightly?.[0];
        if (nightlyRates) {
          const nightlyText = nightlyRates
            .map(rateItem => `${rateItem.type}: ${rateItem.value} ${rateItem.currency}`)
            .join(', ');
          const nightlyP = document.createElement('p');
          nightlyP.textContent = `Nightly Rate (Day 1): ${nightlyText}`;
          nightlyP.style.cursor = 'pointer';
          nightlyP.addEventListener('click', e => {
            e.stopPropagation();
            jsonViewer.textContent = JSON.stringify(
              { nightly_day_1: nightlyRates },
              null,
              2
            );
          });
          propertyDiv.appendChild(nightlyP);
        }
      }
    }

    container.appendChild(propertyDiv);
  });
}




  







// var AvailResponse = null;


// fetch('API_Resources/AvailResponse.json')
//   .then(response => {
//     if (!response.ok) {
//       throw new Error('Network response was not ok');
//     }
//     return response.json(); // Parse JSON
//   })
//   .then(data => {
//     console.log(data); // Use your JSON data here
//     AvailResponse = data;
//   })
//   .catch(error => {
//     console.error('Error loading JSON:', error);
//   });

//   function createBody() {
//     AvailResponse.forEach(item => {
//         const div = document.createElement('div');
//         const h2 = document.createElement('h2');
//         const p = document.createElement('p');

//         h2.textContent = item.title;
//         p.textContent = item.description;

//         div.appendChild(h2);
//         div.appendChild(p);
//         container.appendChild(div);
//     });

//   }