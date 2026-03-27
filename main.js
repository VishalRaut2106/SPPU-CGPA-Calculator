/**
 * GRADEQUEST PRO: ADVANCED ACADEMIC ANALYTICS ENGINE
 * Pattern: Object-Oriented Programming (OOP)
 * Features: Auto-save, Navigation System, SPPU Pattern Mapping, PDF Export
 */

class CGPACalculator {
    constructor() {
        // Core state management
        this.totalCredits = 0;
        this.weightedSum = 0;
        this.finalCGPA = 0;

        // Official SPPU Class Thresholds
        this.THRESHOLDS = {
            DISTINCTION: 7.75,
            FIRST_CLASS: 6.75,
            HIGHER_SECOND: 6.25,
            SECOND_CLASS: 5.5,
            PASS: 4.0
        };

        this.init();
    }

    /**
     * Bootstraps the application
     */
    init() {
        this.attachNavigationListeners();
        this.attachActionListeners();
        this.loadFromStorage();
        
        // Ensure at least one row exists on startup
        if (document.querySelectorAll('.subject-entry').length === 0) {
            this.addNewRow();
        }

        // Set default view to Calculator
        document.querySelector('[data-target="calculator-page"]').click();
    }

    /**
     * Handles Sidebar Navigation (SPA Style)
     */
    attachNavigationListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // UI: Update Active Class
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.target.classList.add('active');

                // Logic: Switch visible section
                const targetId = e.target.getAttribute('data-target');
                document.querySelectorAll('.page-section').forEach(section => {
                    section.style.display = 'none';
                });
                const targetPage = document.getElementById(targetId);
                if (targetPage) targetPage.style.display = 'block';
            });
        });
    }

    /**
     * Attaches listeners to buttons and real-time inputs
     */
    attachActionListeners() {
        document.getElementById('addSubject').addEventListener('click', () => this.addNewRow());
        
        document.getElementById('calculateCGPA').addEventListener('click', () => {
            this.performCalculation();
            this.generateVisualFeedback();
        });

        document.getElementById('clearAll').addEventListener('click', () => this.resetApplication());
        
        document.getElementById('downloadReport').addEventListener('click', () => this.exportToPDF());

        // Real-time auto-save whenever any input changes
        document.getElementById('subjectsList').addEventListener('input', () => this.syncToStorage());
    }

    /**
     * DOM Manipulation: Adds a new subject row to the matrix
     */
    addNewRow(name = "", credit = "", grade = "") {
        const container = document.getElementById('subjectsList');
        const rowId = `row-${Math.random().toString(36).substr(2, 9)}`;
        
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'subject-entry animate-in';
        rowWrapper.id = rowId;
        
        rowWrapper.innerHTML = `
            <input type="text" placeholder="Subject Name" class="sub-name" value="${name}">
            <div class="numeric-inputs" style="display: flex; gap: 10px;">
                <input type="number" class="credits" placeholder="Credits" value="${credit}" min="1" max="10">
                <select class="grades">
                    <option value="10" ${grade == 10 ? 'selected' : ''}>O (10)</option>
                    <option value="9" ${grade == 9 ? 'selected' : ''}>A+ (9)</option>
                    <option value="8" ${grade == 8 ? 'selected' : ''}>A (8)</option>
                    <option value="7" ${grade == 7 ? 'selected' : ''}>B+ (7)</option>
                    <option value="6" ${grade == 6 ? 'selected' : ''}>B (6)</option>
                    <option value="5" ${grade == 5 ? 'selected' : ''}>C (5)</option>
                    <option value="4" ${grade == 4 ? 'selected' : ''}>P (4)</option>
                    <option value="0" ${grade == 0 ? 'selected' : ''}>F (0)</option>
                </select>
            </div>
            <button class="btn-delete" style="cursor:pointer; border:none; background:none; color:#ef4444; font-size:1.2rem;">×</button>
        `;

        rowWrapper.querySelector('.btn-delete').addEventListener('click', () => this.removeRow(rowId));
        container.appendChild(rowWrapper);
        this.syncToStorage();
    }

    removeRow(rowId) {
        const element = document.getElementById(rowId);
        if (element) {
            element.classList.add('animate-out');
            setTimeout(() => {
                element.remove();
                this.syncToStorage();
            }, 300);
        }
    }

    /**
     * Math Engine: Implements SPPU Calculation Logic
     */
    performCalculation() {
        const creditInputs = document.querySelectorAll('.credits');
        const gradeSelects = document.querySelectorAll('.grades');
        
        let localTotalCredits = 0;
        let localWeightedPoints = 0;
        let hasError = false;

        creditInputs.forEach((input, index) => {
            const val = parseFloat(input.value);
            const gp = parseFloat(gradeSelects[index].value);

            if (isNaN(val) || val <= 0) {
                input.style.borderColor = '#ef4444';
                hasError = true;
            } else {
                input.style.borderColor = '#cbd5e1';
                localTotalCredits += val;
                localWeightedPoints += (val * gp);
            }
        });

        if (hasError) {
            alert("Please fill in all credit values correctly.");
            return;
        }

        this.totalCredits = localTotalCredits;
        this.weightedSum = localWeightedPoints;
        this.finalCGPA = this.totalCredits > 0 ? (this.weightedSum / this.totalCredits) : 0;
        
        this.updateUI();
    }

    updateUI() {
        const cgpaVal = this.finalCGPA.toFixed(2);
        
        // Calculate Percentage based on SPPU standard
        const percentage = this.finalCGPA >= 7 
            ? (this.finalCGPA * 8.8).toFixed(2) 
            : ((this.finalCGPA - 0.75) * 10).toFixed(2);

        // Determine Award Class
        let award = "Fail";
        if (this.finalCGPA >= this.THRESHOLDS.DISTINCTION) award = "Distinction";
        else if (this.finalCGPA >= this.THRESHOLDS.FIRST_CLASS) award = "First Class";
        else if (this.finalCGPA >= this.THRESHOLDS.HIGHER_SECOND) award = "Higher Second";
        else if (this.finalCGPA >= this.THRESHOLDS.PASS) award = "Pass Class";

        // Update DOM
        document.getElementById('cgpaResult').textContent = cgpaVal;
        document.getElementById('convertedPercentage').textContent = `${Math.max(0, percentage)}%`;
        document.getElementById('classAward').textContent = award;

        this.logToHistory(cgpaVal, percentage, award);
    }

    logToHistory(cgpa, perc, award) {
        const historyContainer = document.getElementById('historyLogs');
        const log = document.createElement('div');
        log.className = 'history-item card';
        log.style.padding = '10px';
        log.style.marginBottom = '10px';
        log.style.fontSize = '0.9rem';
        log.style.borderLeft = '4px solid #6366f1';
        
        log.innerHTML = `
            <strong>CGPA: ${cgpa}</strong> | ${award}<br>
            <small style="color: #64748b;">Percentage: ${perc}% • ${new Date().toLocaleTimeString()}</small>
        `;

        if (historyContainer.querySelector('.text-muted')) historyContainer.innerHTML = '';
        historyContainer.prepend(log);
    }

    syncToStorage() {
        const rows = [];
        document.querySelectorAll('.subject-entry').forEach(row => {
            rows.push({
                name: row.querySelector('.sub-name').value,
                credit: row.querySelector('.credits').value,
                grade: row.querySelector('.grades').value
            });
        });
        localStorage.setItem('gradeQuest_data', JSON.stringify(rows));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('gradeQuest_data');
        if (saved) {
            JSON.parse(saved).forEach(item => this.addNewRow(item.name, item.credit, item.grade));
        }
    }

    resetApplication() {
        if (confirm("Reset all data?")) {
            document.getElementById('subjectsList').innerHTML = "";
            localStorage.removeItem('gradeQuest_data');
            this.addNewRow();
            document.getElementById('cgpaResult').textContent = "--";
        }
    }

    generateVisualFeedback() {
        const el = document.getElementById('cgpaResult');
        el.style.transform = 'scale(1.2)';
        el.style.transition = 'transform 0.2s';
        setTimeout(() => el.style.transform = 'scale(1)', 200);
    }

    exportToPDF() {
        const element = document.getElementById('printableArea');
        html2pdf().from(element).save(`SPPU_Result_${Date.now()}.pdf`);
    }
}

// Start Engine
const App = new CGPACalculator();