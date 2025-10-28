document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('receiptForm');
    const projectForm = document.getElementById('createProjectForm');
    const receiptsList = document.getElementById('receipts');
    const receiptsSection = document.getElementById('receipts-list');
    const fileInput = document.getElementById('receiptImage');
    const imagePreview = document.getElementById('imagePreview');

    let receipts = [];
    let projects = [];

    function formatDate(dateString) {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`;
    }

    // Fetch projects from server
    async function fetchProjects() {
        try {
            const response = await fetch('/projects');
            projects = await response.json();
            populateProjectSelect();
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }

    // Populate project select
    function populateProjectSelect() {
        const select = document.getElementById('projectSelect');
        if (select) {
            select.innerHTML = '<option value="">Select Project</option>';
            projects.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = p.name;
                select.appendChild(option);
            });
        }
        displayProjectLinks();
    }

    // Display shareable links for projects
    function displayProjectLinks() {
        const linksDiv = document.getElementById('project-links');
        if (linksDiv) {
            linksDiv.innerHTML = '<ul>';
            projects.forEach(p => {
                const fullUrl = window.location.origin + '/submit/' + p.id;
                linksDiv.innerHTML += `<li><strong>${p.name}</strong>: <a href="/submit/${p.id}" target="_blank">${fullUrl}</a></li>`;
            });
            linksDiv.innerHTML += '</ul>';
        }
    }

    // Fetch receipts from server
    async function fetchReceipts() {
        try {
            const response = await fetch('/receipts');
            receipts = await response.json();
            displayReceipts();
        } catch (error) {
            console.error('Error fetching receipts:', error);
        }
    }

    // Fetch summary
    async function fetchSummary() {
        const response = await fetch('/summary');
        const summary = await response.json();
        const tbody = document.getElementById('summary-body');
        if (tbody) {
            tbody.innerHTML = '';
            summary.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${s.project || 'N/A'}</td><td>${s.count}</td><td>฿${parseFloat(s.total || 0).toFixed(2)}</td>`;
                tbody.appendChild(tr);
            });
        }
    }

    // Display receipts
    function displayReceipts() {
        receiptsList.innerHTML = '';
        if (document.getElementById('receipt-form')) {
            // Mobile list view for upload page
            receipts.forEach(receipt => {
                const li = document.createElement('li');
                const img = document.createElement('img');
                img.src = `/uploads/${receipt.imagePath}`;
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';
            li.innerHTML = `
                    <strong>Project: ${receipt.projectName || 'N/A'}</strong><br>
                    <strong>Room: ${receipt.roomNumber}</strong><br>
                    <strong>Level: ${receipt.studyLevel}</strong><br>
                    <strong>Student ID: ${receipt.studentId}</strong><br>
                    Amount: ฿${receipt.amount}<br>
                    Date: ${formatDate(receipt.transferDate)}<br>
                `;
                li.appendChild(img);
                receiptsList.appendChild(li);
            });
        } else {
            // Group receipts by project
            const receiptsByProject = {};
            receipts.forEach(receipt => {
                const projectName = receipt.projectName || 'N/A';
                if (!receiptsByProject[projectName]) {
                    receiptsByProject[projectName] = [];
                }
                receiptsByProject[projectName].push(receipt);
            });

            // Create sections for each project
            Object.keys(receiptsByProject).forEach(projectName => {
                const projectReceipts = receiptsByProject[projectName];

                // Project section header
                const projectSection = document.createElement('div');
                projectSection.style.marginBottom = '30px';

                const projectTitle = document.createElement('h3');
                projectTitle.textContent = `${projectName} (${projectReceipts.length} receipts)`;
                projectTitle.style.borderBottom = '2px solid #4e8bc4';
                projectTitle.style.paddingBottom = '10px';
                projectTitle.style.color = '#4e8bc4';
                projectTitle.style.marginBottom = '20px';
                projectSection.appendChild(projectTitle);

                // Group receipts by level and room within this project
                const receiptsByLevelRoom = {};
                projectReceipts.forEach(receipt => {
                    const levelRoomKey = `${receipt.studyLevel}_${receipt.roomNumber}`;
                    if (!receiptsByLevelRoom[levelRoomKey]) {
                        receiptsByLevelRoom[levelRoomKey] = [];
                    }
                    receiptsByLevelRoom[levelRoomKey].push(receipt);
                });

                // Create subsections for each level/room combination
                Object.keys(receiptsByLevelRoom).sort().forEach(levelRoomKey => {
                    const [level, room] = levelRoomKey.split('_');
                    const levelRoomReceipts = receiptsByLevelRoom[levelRoomKey];

                    // Level/Room subsection header
                    const levelRoomSection = document.createElement('div');
                    levelRoomSection.style.marginBottom = '20px';
                    levelRoomSection.style.marginLeft = '20px';

                    const levelRoomTitle = document.createElement('h4');
                    levelRoomTitle.textContent = `Level ${level}, Room ${room} (${levelRoomReceipts.length} receipts)`;
                    levelRoomTitle.style.borderBottom = '1px solid #FF99BE';
                    levelRoomTitle.style.paddingBottom = '5px';
                    levelRoomTitle.style.color = '#FF99BE';
                    levelRoomTitle.style.marginBottom = '10px';
                    levelRoomTitle.style.fontSize = '1.1rem';
                    levelRoomTitle.style.fontWeight = '600';
                    levelRoomSection.appendChild(levelRoomTitle);

                    // Container for scrollable table
                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'table-container';

                    // Table for this level/room's receipts
                    const table = document.createElement('table');
                    table.style.width = '100%';
                    table.style.borderCollapse = 'collapse';
                    table.style.marginBottom = '0';
                    table.style.minWidth = '600px';

                    const headers = ['Student ID', 'Amount', 'Date', 'Image'];
                    const thead = document.createElement('thead');
                    const trh = document.createElement('tr');
                    headers.forEach(h => {
                        const th = document.createElement('th');
                        th.textContent = h;
                        th.style.border = '1px solid #ddd';
                        th.style.padding = '8px';
                        th.style.backgroundColor = '#f9f9f9';
                        th.style.fontWeight = 'bold';
                        th.style.fontSize = '0.9rem';
                        trh.appendChild(th);
                    });
                    thead.appendChild(trh);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');
                    levelRoomReceipts.forEach(receipt => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="border:1px solid #ddd; padding:8px;">${receipt.studentId}</td>
                            <td style="border:1px solid #ddd; padding:8px;">฿${receipt.amount}</td>
                            <td style="border:1px solid #ddd; padding:8px;">${formatDate(receipt.transferDate)}</td>
                        `;
                        const td = document.createElement('td');
                        td.style.border = '1px solid #ddd';
                        td.style.padding = '8px';
                        const img = document.createElement('img');
                        img.src = `/uploads/${receipt.imagePath}`;
                        img.style.maxWidth = '100px';
                        img.style.maxHeight = '100px';
                        img.style.cursor = 'pointer';
                        img.style.borderRadius = '4px';
                        img.title = 'Click to preview';
                        td.appendChild(img);
                        tr.appendChild(td);
                        tbody.appendChild(tr);
                    });
                    table.appendChild(tbody);
                    tableContainer.appendChild(table);
                    levelRoomSection.appendChild(tableContainer);
                    projectSection.appendChild(levelRoomSection);

                    // Add click handlers to images for modal preview
                    const images = levelRoomSection.querySelectorAll('img');
                    images.forEach(img => {
                        img.addEventListener('click', function() {
                            openImageModal(this.src);
                        });
                    });
                });

                receiptsList.appendChild(projectSection);
            });
        }
    }

    // Image preview modal functions
    function openImageModal(imageSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        if (modal && modalImg) {
            modalImg.src = imageSrc;
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
        }
    }

    function closeImageModal() {
        const modal = document.getElementById('imageModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Close modal when clicking the close button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'closeModal') {
            closeImageModal();
        }
        // Close modal when clicking outside the image
        if (e.target.id === 'imageModal') {
            closeImageModal();
        }
    });

    // Set default date to today as dd/mm/yyyy
    const dateInput = document.getElementById('transferDate');
    if (dateInput) {
        const today = new Date();
        const d = today.getDate().toString().padStart(2,'0');
        const m = (today.getMonth()+1).toString().padStart(2,'0');
        const y = today.getFullYear();
        dateInput.value = `${d}/${m}/${y}`;
    }

    // Initial fetch and display
    fetchProjects();
    fetchReceipts();
    if (!document.getElementById('receipt-form')) {
        fetchSummary();
    }

    // Handle image preview
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData();
            formData.append('projectSelect', document.getElementById('projectSelect').value);
            formData.append('roomSelect', document.getElementById('roomSelect').value);
            formData.append('studyLevel', document.getElementById('studyLevel').value);
            formData.append('studentId', document.getElementById('studentId').value);
            formData.append('amount', document.getElementById('amount').value);
            formData.append('transferDate', document.getElementById('transferDate').value);
            formData.append('notes', document.getElementById('notes').value);
            formData.append('receiptImage', document.getElementById('receiptImage').files[0]);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    // Show success message
                    const successMsg = document.getElementById('successMessage');
                    if (successMsg) {
                        successMsg.textContent = 'Receipt submitted successfully!';
                        successMsg.style.display = 'block';
                        setTimeout(() => {
                            successMsg.style.display = 'none';
                        }, 5000); // Hide after 5 seconds
                    } else if (document.getElementById('receipt-form')) {
                        // Fallback for other pages without successMessage div
                        alert('Receipt submitted successfully!');
                    }
                    // Refresh receipts
                    fetchReceipts();
                    // Clear form
                    form.reset();
                    imagePreview.src = '';
                } else {
                    alert('Upload failed.');
                }
            } catch (error) {
                console.error('Error uploading:', error);
                alert('Error uploading receipt.');
            }
        });
    }

    // Project form now submits via HTML form to /projects for simplicity
});
