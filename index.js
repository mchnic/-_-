function handleTabClicked(event) {
    const tabCategory = event.target.id;
    const content = document.querySelector(`.content.${tabCategory}`);
    const contents = document.querySelectorAll(`.content`);
    for(let current of contents) {
        if (current == content) {
            current.classList.add("active");
        } else {
            current.classList.remove("active");
        }
    }
}

function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
    generateStatistics();
}

function displayData(data) {
    const table = document.getElementById('dataTable');
    table.innerHTML = ''; // Очищаем таблицу перед добавлением новых данных

    const rows = data.trim().split('\n');

    rows.forEach((row, index) => {
        const rowData = row.split(';');
        const tableRow = document.createElement('tr');

        rowData.forEach((cellData, cellIndex) => {
            const cell = document.createElement('td');
            cell.textContent = cellData;
            tableRow.appendChild(cell);
        });

        if (index !== 0) {
            const editCell = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Редактировать';
            editButton.classList.add('edit-btn'); // Добавляем класс для кнопки редактирования
            editButton.onclick = function() {
                editRow(this);
            };
            editCell.appendChild(editButton);
            tableRow.appendChild(editCell);

            const deleteCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.onclick = function() {
                deleteRow(this);
            };
            deleteButton.classList.add('delete-btn'); // Добавляем класс для кнопки удаления
            deleteCell.appendChild(deleteButton);
            tableRow.appendChild(deleteCell);
        }

        table.appendChild(tableRow);
    });
    generateStatistics();
}

function editRow(btn) {
    const row = btn.parentNode.parentNode;
    const cells = row.querySelectorAll('td');
    
    cells.forEach(cell => {
        if (!cell.querySelector('.edit-btn')) { // Игнорируем ячейку с кнопкой редактирования
            const oldValue = cell.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = oldValue;
            cell.textContent = '';
            cell.appendChild(input);
        }
    });

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Сохранить';
    saveButton.onclick = function() {
        saveRow(row);
    };
    row.appendChild(saveButton);
    btn.disabled = true; // Блокируем кнопку "Редактировать"
}

function saveRow(row) {
    const cells = row.querySelectorAll('td');

    cells.forEach(cell => {
        if (cell.querySelector('input')) { // Проверяем, есть ли в ячейке input
            const newValue = cell.querySelector('input').value;
            cell.textContent = newValue;
        }
    });

    row.removeChild(row.lastChild); // Удаляем кнопку "Сохранить"
    row.querySelector('.edit-btn').disabled = false; // Разблокируем кнопку "Редактировать"
    generateStatistics();
}

function saveToFile() {
    const table = document.getElementById('dataTable');
    const rows = table.querySelectorAll('tr');
    let data = '';
    let csvData = '';

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowData = '';
        cells.forEach((cell, index) => {
            // Исключаем кнопки "Редактировать" и "Удалить" из данных
            if (!cell.querySelector('.edit-btn') && !cell.querySelector('.delete-btn')) {
                if (index !== cells.length - 1) { // Проверяем, что это не последняя ячейка в строке
                    rowData += cell.textContent + ';'; // Добавляем значение ячейки с разделителем ";"
                } else {
                    rowData += cell.textContent; // Добавляем значение последней ячейки без разделителя
                }
            }
        });
        data += rowData + '\n'; // Добавляем данные строки в общие данные с разделителем новой строки
        csvData += rowData + ',\n'; // Для CSV используем запятую в качестве разделителя
    });

    const textBlob = new Blob([data], { type: 'text/plain' });
    const csvBlob = new Blob([csvData], { type: 'text/csv' });

    downloadFile(textBlob, 'edited_data.txt');
    downloadFile(csvBlob, 'edited_data.csv');
    downloadExcel(data);
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadExcel(data) {
    const rows = data.trim().split('\n').map(row => row.split(';'));
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'edited_data.xls');
}

function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            const decoder = new TextDecoder('utf-8');
            const data = decoder.decode(arrayBuffer);

            // Определяем тип файла по расширению и обрабатываем соответственно
            const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'xls' || fileExtension === 'xlsx') {
                handleXLSFile(arrayBuffer);
            } else {
                displayData(data);
            }
        };
        reader.onerror = function() {
            console.error('Ошибка при чтении файла');
        };
    } else {
        console.error('Файл не выбран');
    }
}

function handleXLSFile(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
    displayData(csv);
}

function addRow() {
    const table = document.getElementById('dataTable');
    const newRow = document.createElement('tr');

    // Создаем пустые ячейки для каждого столбца в таблице
    const columnCount = table.rows[0].cells.length; // Получаем количество столбцов в первой строке таблицы
    for (let i = 0; i < columnCount; i++) {
        const cell = document.createElement('td');
        cell.innerHTML = '<input type="text" class="new-data">'; // Создаем текстовое поле в ячейке
        newRow.appendChild(cell); // Добавляем ячейку в строку
    }

    // Создаем кнопки "Сохранить" для новой строки
    const editCell = document.createElement('td');
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Сохранить';
    saveButton.onclick = function() {
        saveNewRow(newRow); // Вызываем функцию сохранения при клике на кнопку "Сохранить"
    };
    editCell.appendChild(saveButton);
    newRow.appendChild(editCell);

    table.appendChild(newRow); // Добавляем новую строку в конец таблицы
}

function saveNewRow(row) {
    const cells = row.querySelectorAll('.new-data'); // Находим все текстовые поля в строке

    cells.forEach(cell => {
        const newValue = cell.value; // Получаем значение из текстового поля
        cell.parentNode.innerHTML = newValue; // Заменяем текстовое поле на новое значение
    });

    // Удаляем кнопку "Сохранить" из строки
    const saveButton = row.querySelector('button');
    saveButton.parentNode.removeChild(saveButton);

    // Создаем новые кнопки "Редактировать" и "Удалить" в последней ячейке строки
    const editButton = document.createElement('button');
    editButton.textContent = 'Редактировать';
    editButton.classList.add('edit-btn');
    editButton.onclick = function() {
        editRow(this);
    };
    row.lastElementChild.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.classList.add('delete-btn');
    deleteButton.onclick = function() {
        deleteRow(this);
    };
    row.lastElementChild.appendChild(deleteButton);
    generateStatistics();
}

function calculateAverage(grades) {
    const sum = grades.reduce((a, b) => a + b, 0);
    return (sum / grades.length) || 0;
}

function calculateMedian(grades) {
    const sortedGrades = [...grades].sort((a, b) => a - b);
    const mid = Math.floor(sortedGrades.length / 2);
    return sortedGrades.length % 2 !== 0
        ? sortedGrades[mid]
        : (sortedGrades[mid - 1] + sortedGrades[mid]) / 2;
}

function countGrades(grades) {
    const counts = { '2': 0, '3': 0, '4': 0, '5': 0 };
    grades.forEach(grade => {
        if (counts[grade] !== undefined) {
            counts[grade]++;
        }
    });
    return counts;
}

function clearCharts() {
    if (window.classChart) {
        window.classChart.destroy();
    }
    if (window.studentChart) {
        window.studentChart.destroy();
    }
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateStatistics() {
    const studentsTable = document.getElementById('dataTable');
    if (!studentsTable) {
        console.error('Таблица студентов не найдена!');
        return;
    }
    const statistics = {};

    for (let row of studentsTable.rows) {
        if (row.rowIndex === 0) continue;
        if (row.cells.length < 7) {
            console.error(`Найдена строка с недостаточным количеством ячеек: ${row.innerHTML}`);
            continue;
        }

        const classInfo = row.cells[1].textContent;
        const grades = Array.from(row.cells).slice(2, -2).map(cell => parseInt(cell.textContent, 10)).filter(Boolean);

        if (!statistics[classInfo]) {
            statistics[classInfo] = grades.map(() => ({
                total: [],
                average: 0,
                median: 0,
                counts: { '2': 0, '3': 0, '4': 0, '5': 0 },
                percentages: { '2': 0, '3': 0, '4': 0, '5': 0 }
            }));
        }
        grades.forEach((grade, i) => {
            if (grade) {
                statistics[classInfo][i].total.push(grade);
            }
        });
    }

    for (let classInfo of Object.keys(statistics)) {
        statistics[classInfo].forEach((subjectStats, index) => {
            subjectStats.average = calculateAverage(subjectStats.total);
            subjectStats.median = calculateMedian(subjectStats.total);
            const gradeCounts = countGrades(subjectStats.total);
            for (let grade of Object.keys(gradeCounts)) {
                subjectStats.counts[grade] = gradeCounts[grade];
                subjectStats.percentages[grade] = (gradeCounts[grade] / subjectStats.total.length) * 100;
            }
        });
    }

    const studentStatistics = {};

    for (let row of studentsTable.rows) {
        if (row.rowIndex === 0 || row.cells.length < 7) continue;

        const studentName = row.cells[0].textContent;
        const grades = Array.from(row.cells).slice(2, -2).map(cell => parseInt(cell.textContent, 10)).filter(Boolean);

        if (!studentStatistics[studentName]) {
            studentStatistics[studentName] = grades.map(() => ({
                total: [],
                average: 0,
                median: 0,
                counts: { '2': 0, '3': 0, '4': 0, '5': 0 },
                percentages: { '2': 0, '3': 0, '4': 0, '5': 0 }
            }));
        }

        grades.forEach((grade, i) => {
            if (grade) {
                studentStatistics[studentName][i].total.push(grade);
            }
        });
    }

    for (let studentName of Object.keys(studentStatistics)) {
        studentStatistics[studentName].forEach((subjectStats, index) => {
            subjectStats.average = calculateAverage(subjectStats.total);
            subjectStats.median = calculateMedian(subjectStats.total);
            const gradeCounts = countGrades(subjectStats.total);
            for (let grade of Object.keys(gradeCounts)) {
                subjectStats.counts[grade] = gradeCounts[grade];
                subjectStats.percentages[grade] = (gradeCounts[grade] / subjectStats.total.length) * 100;
            }
        });
    }

    clearCharts();

    displayStatistics(statistics, studentStatistics);
    createClassChart(statistics);
    createStudentChart(studentStatistics);
}

function createClassChart(statistics) {
    const classData = {
        labels: Object.keys(statistics),
        datasets: []
    };

    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
    subjects.forEach((subject, index) => {
        const dataset = {
            label: subject,
            data: [],
            backgroundColor: getRandomColor(),
            borderWidth: 1
        };

        Object.values(statistics).forEach(classStats => {
            if (classStats[index]) {
                dataset.data.push(classStats[index].average);
            } else {
                dataset.data.push(0);
            }
        });

        classData.datasets.push(dataset);
    });

    const ctx = document.getElementById('class-chart').getContext('2d');

    window.classChart = new Chart(ctx, {
        type: 'polarArea',
        data: classData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createStudentChart(studentStatistics) {
    const studentData = {
        labels: Object.keys(studentStatistics),
        datasets: []
    };

    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
    subjects.forEach((subject, index) => {
        const dataset = {
            label: subject,
            data: [],
            backgroundColor: getRandomColor(),
            borderWidth: 1
        };

        Object.values(studentStatistics).forEach(studentStats => {
            if (studentStats[index]) {
                dataset.data.push(studentStats[index].average);
            } else {
                dataset.data.push(0);
            }
        });

        studentData.datasets.push(dataset);
    });

    const ctx = document.getElementById('student-chart').getContext('2d');

    window.studentChart = new Chart(ctx, {
        type: 'polarArea',
        data: studentData,
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function displayStatistics(statistics, studentStatistics) {
    const statsSection = document.getElementById('table-stats');
    let html = '<table class="table-stat">';
    html += '<thead>';
    html += '<tr><th>Класс</th><th>Предмет</th><th>Средняя оценка</th><th>Медиана</th>';

    for (let i = 5; i > 1; i--) {
        html += `<th>Количество ${i}</th>`;
    }
    for (let i = 5; i > 1; i--) {
        html += `<th>Процент ${i}</th>`;
    }

    html += '</tr></thead><tbody>';

    const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];

    for (let classInfo of Object.keys(statistics)) {
        statistics[classInfo].forEach((subjectStats, index) => {
            html += `<tr>`;
            html += `<td>${classInfo}</td>`;
            html += `<td>${subjects[index]}</td>`;
            html += `<td>${subjectStats.average.toFixed(2)}</td>`;
            html += `<td>${subjectStats.median.toFixed(2)}</td>`;

            for (let i = 5; i > 1; i--) {
                html += `<td>${subjectStats.counts[i] || 0}</td>`;
            }
            for (let i = 5; i > 1; i--) {
                html += `<td>${(subjectStats.percentages[i] || 0).toFixed(2)}%</td>`;
            }
            html += `</tr>`;
        });
    }
    html += '</tbody></table>';

    let studentStatsHtml = '<h3>Статистика по ученикам</h3><table>';

    studentStatsHtml += '<thead>';
    studentStatsHtml += '<tr><th>Имя ученика</th><th>Предмет</th><th>Средняя оценка</th><th>Медиана</th>';
    for (let i = 5; i > 1; i--) {
        studentStatsHtml += `<th>Количество ${i}</th>`;
    }
    for (let i = 5; i > 1; i--) {
        studentStatsHtml += `<th>Процент ${i}</th>`;
    }
    studentStatsHtml += '</tr></thead><tbody>';

    for (let studentName of Object.keys(studentStatistics)) {
        studentStatistics[studentName].forEach((subjectStats, index) => {
            studentStatsHtml += `<tr>`;
            studentStatsHtml += `<td>${studentName}</td>`;
            studentStatsHtml += `<td>${subjects[index]}</td>`;
            studentStatsHtml += `<td>${subjectStats.average.toFixed(2)}</td>`;
            studentStatsHtml += `<td>${subjectStats.median.toFixed(2)}</td>`;
            for (let i = 5; i > 1; i--) {
                studentStatsHtml += `<td>${subjectStats.counts[i] || 0}</td>`;
            }
            for (let i = 5; i > 1; i--) {
                studentStatsHtml += `<td>${(subjectStats.percentages[i] || 0).toFixed(2)}%</td>`;
            }
            studentStatsHtml += `</tr>`;
        });
    }

    studentStatsHtml += '</tbody></table>';

    statsSection.innerHTML = html + studentStatsHtml;
}
