window.Calendar = (() => {
    const calendarEl = document.getElementById('calendar');
    const monthTitle = document.getElementById('current-month-title');
    let current = new Date();
    let selectedDay = null;

    // Cargar y guardar comidas por fecha
    function getSavedMeals() {
        return JSON.parse(localStorage.getItem('calendarMeals') || '{}');
    }
    function saveMealsForDate(dateStr, meals) {
    const data = getSavedMeals();
    const isEmpty = Object.values(meals).every(arr => Array.isArray(arr) && arr.length === 0);

    if (isEmpty) {
        delete data[dateStr];
    } else {
        data[dateStr] = { ...meals, _manual: true }; // <-- Marca manual
    }
    localStorage.setItem('calendarMeals', JSON.stringify(data));
}

    function formatDateSpanish(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function render() {
        if (!calendarEl || !monthTitle) return;
        calendarEl.innerHTML = '';
        const year = current.getFullYear();
        const month = current.getMonth();
        const today = new Date();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        monthTitle.textContent = current.toLocaleString('es-ES', { month: 'long' });
        const yearTitle = document.getElementById('calendar-year-title');
        if (yearTitle) {
            yearTitle.textContent = current.getFullYear();
            const statsToggle = document.getElementById('calendar-stats-toggle');
            if (statsToggle && !statsToggle.dataset.listener) {
                statsToggle.addEventListener('click', function() {
                    const panel = document.getElementById('calendar-stats-panel');
                    this.classList.toggle('rotated');
                    if (panel.style.display === 'none' || !panel.style.display) {
                        renderCalendarStats();
                        panel.style.display = 'block';
                    } else {
                        panel.style.display = 'none';
                    }
                });
                statsToggle.dataset.listener = "true";
            }
        }

        const saveBtn = document.getElementById('calendar-save-btn');
        if (saveBtn) {
            const fecha = selectedDay || getLocalDateString(new Date());
            saveBtn.textContent = `Guardar (${formatDateSpanish(fecha)})`;
        }

        // Días de la semana
        const daysRow = document.createElement('div');
        daysRow.style.display = 'grid';
        daysRow.style.gridTemplateColumns = 'repeat(7,1fr)';
        ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(d => {
            const el = document.createElement('div');
            el.style.fontWeight = 'bold';
            el.style.textAlign = 'center';
            el.textContent = d;
            daysRow.appendChild(el);
        });
        calendarEl.appendChild(daysRow);

        // Celdas vacías antes del primer día
        let grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(7,1fr)';
        for (let i = 0; i < (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1); i++) {
            grid.appendChild(document.createElement('div'));
        }

        // Días del mes
        const savedMeals = getSavedMeals();
const assignedDiets = getAssignedDiets();
const todayStr = getLocalDateString(new Date());

for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = getLocalDateString(dateObj);
    const weekdayMap = [ 'D', 'L', 'M', 'X', 'J', 'V', 'S' ];
    const weekday = weekdayMap[dateObj.getDay()];

    // Restaurar dieta recurrente en días pasados (si no hay cambio manual)
    if (
        dateStr < todayStr &&
        assignedDiets[weekday] &&
        dateStr >= assignedDiets[weekday].from
    ) {
        if (savedMeals[dateStr]) {
            delete savedMeals[dateStr];
            localStorage.setItem('calendarMeals', JSON.stringify(savedMeals));
        }
    }

    // Decide qué comidas mostrar: primero las guardadas, si no, la dieta recurrente
    let mealsToShow = savedMeals[dateStr];
    if (
        !mealsToShow &&
        assignedDiets[weekday] &&
        dateStr >= assignedDiets[weekday].from
    ) {
        mealsToShow = assignedDiets[weekday].meals;
    }

    const dayBtn = document.createElement('button');
    dayBtn.textContent = d;
    dayBtn.style.margin = '2px';
    dayBtn.style.padding = '8px';
    dayBtn.style.borderRadius = '50%';
    dayBtn.style.border = 'none';
    dayBtn.style.background = 'none';
    dayBtn.style.cursor = 'pointer';
    dayBtn.style.position = 'relative';
    dayBtn.style.transition = 'background 0.2s';

    // Día actual: azul pastel
    if (
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
    ) {
        dayBtn.style.background = '#b3e5fc';
        dayBtn.style.color = '#185a9d';
        dayBtn.style.fontWeight = 'bold';
    }

    // Muestra el punto si hay comidas (manual o recurrente)
    if (mealsToShow) {
        const dot = document.createElement('span');
        dot.style.position = 'absolute';
        dot.style.bottom = '6px';
        dot.style.left = '50%';
        dot.style.transform = 'translateX(-50%)';
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.borderRadius = '50%';

        // Calcula macros totales del día
        let macros = { kcal: 0, protein: 0, carbs: 0, fats: 0 };
        Object.values(mealsToShow)
        .filter(foods => Array.isArray(foods))
        .forEach(foods => {
            foods.forEach(f => {
                macros.kcal += (f.calories * f.quantity / 100);
                macros.protein += (f.protein * f.quantity / 100);
                macros.carbs += (f.carbs * f.quantity / 100);
                macros.fats += (f.fats * f.quantity / 100);
            });
        });

        // Usa los objetivos del usuario si existen
        const targets = window.state?.userMacros || { calories: 2000, protein: 120, carbs: 220, fats: 60 };

        function getDeviation(val, target) {
            if (!target) return 0;
            return Math.abs((val - target) / target);
        }
        const deviations = [
            getDeviation(macros.kcal, targets.calories),
            getDeviation(macros.protein, targets.protein),
            getDeviation(macros.carbs, targets.carbs),
            getDeviation(macros.fats, targets.fats)
        ];
        const maxDev = Math.max(...deviations);

        // Color según desviación
        if (maxDev <= 0.10) {
            dot.style.background = '#43cea2'; // verde
        } else if (maxDev <= 0.30) {
            dot.style.background = '#ffd600'; // amarillo
        } else {
            dot.style.background = '#e74c3c'; // rojo
        }

        dayBtn.appendChild(dot);
    }

    // Tooltip al pasar el ratón
    dayBtn.onmouseenter = (e) => {
        let tooltipMeals = savedMeals[dateStr];
        if (
            !tooltipMeals &&
            assignedDiets[weekday] &&
            dateStr >= assignedDiets[weekday].from
        ) {
            tooltipMeals = assignedDiets[weekday].meals;
        }
        showTooltip(e.target, dateStr, tooltipMeals);
    };
    dayBtn.onmouseleave = hideTooltip;

    dayBtn.onclick = () => {
        selectedDay = dateStr;
        render();
    };

    // Día seleccionado
    if (dateStr === selectedDay) {
        dayBtn.style.outline = '2.5px solid #3498db';
        dayBtn.style.background = '#e3f2fd';
    }

    // Asignación de dieta recurrente: resaltar días correspondientes
    if (
        assignedDiets[weekday] &&
        dateStr >= assignedDiets[weekday].from &&
        dateStr !== selectedDay &&
        !(d === today.getDate() && month === today.getMonth() && year === today.getFullYear())
    ) {
        dayBtn.style.background = '#e3f2fd';
        dayBtn.style.boxShadow = '0 0 0 2px #90caf9 inset';
    }

    grid.appendChild(dayBtn);
}
calendarEl.appendChild(grid);

        // Esto NO debe estar fuera de render ni del bucle:
        

        const statsToggle = document.getElementById('calendar-stats-toggle');
        const statsPanel = document.getElementById('calendar-stats-panel');
        if (statsToggle && !statsToggle.dataset.listener) {
            statsToggle.addEventListener('click', function() {
                this.classList.toggle('rotated');
                if (statsPanel.style.display === 'none' || !statsPanel.style.display) {
                    renderCalendarStats();
                    statsPanel.style.display = 'block';
                } else {
                    statsPanel.style.display = 'none';
                }
            });
            statsToggle.dataset.listener = "true";
        }

        // ACTUALIZA EL PANEL SI ESTÁ ABIERTO
        if (statsPanel && statsPanel.style.display === 'block') {
            renderCalendarStats();
        }
    }

    function showTooltip(target, dateStr, meals) {
    let tooltip = document.getElementById('calendar-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'calendar-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.background = '#fff';
        tooltip.style.color = '#222';
        tooltip.style.border = '1px solid #3498db';
        tooltip.style.borderRadius = '8px';
        tooltip.style.boxShadow = '0 2px 8px rgba(44,62,80,0.13)';
        tooltip.style.padding = '12px 16px';
        tooltip.style.fontSize = '1em';
        tooltip.style.zIndex = 9999;
        tooltip.style.minWidth = '200px';
        tooltip.style.maxWidth = '350px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.display = 'block';
        document.body.appendChild(tooltip);
    }
    if (!meals) {
        tooltip.innerHTML = '<span style="color:#888;">No hay comidas guardadas para este día</span>';
    } else {
        // Resumen de comidas y macros
        let macros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
        let html = `<div style="font-weight:600;color:#3498db;margin-bottom:4px;">Resumen del día ${formatDateSpanish(dateStr)}:</div>`;
        Object.entries(meals).forEach(([meal, foods]) => {
            if (!foods.length) return;
            html += `<div style="margin-bottom:2px;"><b>${meal}:</b> `;
            html += foods.map(f => `${f.emoji || ''} ${f.name} (${f.quantity}g)`).join(', ');
            html += `</div>`;
            foods.forEach(f => {
                macros.calories += (f.calories * f.quantity / 100);
                macros.protein += (f.protein * f.quantity / 100);
                macros.carbs += (f.carbs * f.quantity / 100);
                macros.fats += (f.fats * f.quantity / 100);
            });
        });
        html += `<div style="margin-top:6px;font-size:0.98em;">
            <b>Macros:</b>
            🔥 ${macros.calories.toFixed(1)} kcal,
            💪 ${macros.protein.toFixed(1)}g,
            🍞 ${macros.carbs.toFixed(1)}g,
            🥑 ${macros.fats.toFixed(1)}g
        </div>`;
        tooltip.innerHTML = html;
    }
    // Mejor posicionamiento: a la derecha, si no cabe a la izquierda, si no debajo
    const rect = target.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const tooltipWidth = tooltip.offsetWidth || 220;
    const tooltipHeight = tooltip.offsetHeight || 120;

    let left = rect.right + 10 + scrollX;
    let top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;

    // Si no cabe a la derecha, prueba a la izquierda
    if (left + tooltipWidth > scrollX + window.innerWidth) {
        left = rect.left - tooltipWidth - 10 + scrollX;
    }
    // Si tampoco cabe a la izquierda, ponlo debajo
    if (left < scrollX) {
        left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
        top = rect.bottom + 10 + scrollY;
    }
    // Si se sale por arriba, ajústalo
    if (top < scrollY) top = scrollY + 8;
    // Si se sale por abajo, ajústalo
    if (top + tooltipHeight > scrollY + window.innerHeight) {
        top = scrollY + window.innerHeight - tooltipHeight - 8;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
}
    function hideTooltip() {
        const tooltip = document.getElementById('calendar-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    }

    function prevMonth() {
        current.setMonth(current.getMonth() - 1);
        render();
    }
    function nextMonth() {
        current.setMonth(current.getMonth() + 1);
        render();
    }

    function saveMealsForToday() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10);
        // Copia profunda de las comidas actuales
        const meals = JSON.parse(JSON.stringify(window.state.selectedFoods));
        saveMealsForDate(dateStr, meals);
        render();
    }

    function selectDay() {
        const dateStr = prompt('Introduce la fecha (YYYY-MM-DD):');
        if (!dateStr) return;
        // Copia profunda de las comidas actuales
        const meals = JSON.parse(JSON.stringify(window.state.selectedFoods));
        saveMealsForDate(dateStr, meals);
        render();
    }

    function saveMealsForSelectedDay() {
        const dateStr = selectedDay || getLocalDateString(new Date());
        const meals = JSON.parse(JSON.stringify(window.state.selectedFoods));
        saveMealsForDate(dateStr, meals);
        render();
    }

    function goToToday() {
        current = new Date();
        selectedDay = getLocalDateString(current);
        render();
    }

    function renderCalendarStats() {
        const panel = document.getElementById('calendar-stats-panel');
        if (!panel) return;
        const year = current.getFullYear();
        const month = current.getMonth();
        const savedMeals = getSavedMeals();

        // Agrupa comidas por semana del mes actual
        const weeks = {};
        Object.keys(savedMeals).forEach(dateStr => {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (y === year && m - 1 === month) {
                const dateObj = new Date(dateStr);
                // Número de semana del mes (1-5)
                const weekNum = Math.ceil((dateObj.getDate() + (dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1)) / 7);
                if (!weeks[weekNum]) weeks[weekNum] = [];
                weeks[weekNum].push(savedMeals[dateStr]);
            }
        });

        // Calcula medias semanales
        let html = '<div style="font-weight:600;color:#3498db;margin-bottom:8px;">Medias semanales</div>';
        let anyWeek = false;
        Object.keys(weeks).sort((a, b) => a - b).forEach(weekNum => {
            const weekMeals = weeks[weekNum];
            if (!weekMeals.length) return;
            anyWeek = true;
            const stats = calcAverages(weekMeals);
            html += `
                <div style="margin-bottom:6px; display: flex; align-items: center;">
                    <b style="min-width: 90px;">Semana ${weekNum}:</b>
                    <span style="display: inline-flex; flex: 1; justify-content: space-between;">
                        <span>🔥${stats.kcal}</span>
                        <span>💪${stats.protein}</span>
                        <span>🍞${stats.carbs}</span>
                        <span>🥑${stats.fats}</span>
                    </span>
                </div>
            `;
        });
        if (!anyWeek) html += '<div style="color:#888;">No hay datos guardados este mes</div>';

        // Calcula medias mensuales
        const monthMeals = [];
        Object.keys(savedMeals).forEach(dateStr => {
            const [y, m, d] = dateStr.split('-').map(Number);
            if (y === year && m - 1 === month) {
                monthMeals.push(savedMeals[dateStr]);
            }
        });
        if (monthMeals.length) {
        const stats = calcAverages(monthMeals);
        html += `<div style="font-weight:600;color:#3498db;margin:12px 0 4px 0;">Media mensual</div>
            <div style="display: flex; align-items: center;">
                <span style="display: inline-flex; flex: 1; justify-content: space-between;">
                    <span>🔥${stats.kcal}</span>
                    <span>💪${stats.protein}</span>
                    <span>🍞${stats.carbs}</span>
                    <span>🥑${stats.fats}</span>
                </span>
            </div>`;
}

        panel.innerHTML = html;
    }

    function calcAverages(mealsArr) {
        let totalKcal = 0, totalP = 0, totalC = 0, totalF = 0, days = 0;
        mealsArr.forEach(meals => {
            let kcal = 0, p = 0, c = 0, fat = 0;
            Object.values(meals)
            .filter(foods => Array.isArray(foods))
            .forEach(foods => {
                foods.forEach(f => {
                    kcal += (f.calories * f.quantity / 100);
                    p += (f.protein * f.quantity / 100);
                    c += (f.carbs * f.quantity / 100);
                    fat += (f.fats * f.quantity / 100);
                });
            });
            totalKcal += kcal;
            totalP += p;
            totalC += c;
            totalF += fat;
            days++;
        });
        return {
            kcal: days ? Math.round(totalKcal / days) : 0,
            protein: days ? Math.round(totalP / days) : 0,
            carbs: days ? Math.round(totalC / days) : 0,
            fats: days ? Math.round(totalF / days) : 0
        };
    }

    function assignDietToDay() {
        const selected = window.selectedDay; // día concreto
        const selectedWeekdays = window.selectedWeekdays || []; // array de días de la semana
        const currentDiet = JSON.parse(JSON.stringify(window.state.selectedFoods));
        const assignedDiets = getAssignedDiets();

        if (selectedWeekdays.length > 0) {
            const from = getLocalDateString(new Date());
            selectedWeekdays.forEach(day => {
                assignedDiets[day] = { from, meals: currentDiet };
            });
           
        } else if (selected) {
            assignedDiets[selected] = { meals: currentDiet };
            
        }
        saveAssignedDiets(assignedDiets);
        render();
    }

    function getAssignedDiets() {
        return JSON.parse(localStorage.getItem('assignedDiets') || '{}');
    }

    function saveAssignedDiets(data) {
    localStorage.setItem('assignedDiets', JSON.stringify(data));
}

    return { 
        render, 
        prevMonth, 
        nextMonth, 
        saveMealsForToday: saveMealsForSelectedDay, 
        selectDay, 
        saveMealsForSelectedDay, 
        goToToday,
        assignDietToDay,
        getAssignedDiets
    };
})();

document.addEventListener('DOMContentLoaded', () => Calendar.render());

function getLocalDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Almacena los días seleccionados para la dieta recurrente
window.selectedWeekdays = []; // Ejemplo: ['L', 'X']

// Inicializa los botones
document.querySelectorAll('.diet-weekday-btn').forEach(btn => {
    btn.onclick = function() {
        const day = this.dataset.weekday;
        const assignedDiets = Calendar.getAssignedDiets ? Calendar.getAssignedDiets() : getAssignedDiets();
        const todayStr = getLocalDateString(new Date());

        if (window.selectedWeekdays.includes(day)) {
            // Desmarcar: quitar de seleccionados y eliminar dieta recurrente futura
            window.selectedWeekdays = window.selectedWeekdays.filter(d => d !== day);
            this.classList.remove('selected');

            // Elimina la dieta recurrente de ese día
            delete assignedDiets[day];

            // Limpia los días futuros de esa dieta recurrente
            const savedMeals = JSON.parse(localStorage.getItem('calendarMeals') || '{}');
            Object.keys(savedMeals).forEach(dateStr => {
                const dateObj = new Date(dateStr);
                const weekdayMap = [ 'D', 'L', 'M', 'X', 'J', 'V', 'S' ];
                const weekday = weekdayMap[dateObj.getDay()];
                if (
                    weekday === day && // <-- aquí
                    dateStr >= todayStr &&
                    !savedMeals[dateStr]._manual
                ) {
                    delete savedMeals[dateStr];
                }
            });
            localStorage.setItem('calendarMeals', JSON.stringify(savedMeals));
            localStorage.setItem('assignedDiets', JSON.stringify(assignedDiets));
            Calendar.render();
        } else {
            // Marcar: añadir a seleccionados y asignar dieta
            window.selectedWeekdays.push(day);
            this.classList.add('selected');
            Calendar.assignDietToDay();
        }
    };
});
