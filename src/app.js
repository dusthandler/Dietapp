import { foodDB } from './data/foods.js';
import { categories } from './data/categories.js';

const App = (() => {
                // Base de datos de alimentos
                
                let customFoods = JSON.parse(localStorage.getItem('customFoods') || '{}');
                let editingFoodName = null;

                function getAllFoods() {
                    const deletedFoods = JSON.parse(localStorage.getItem('deletedFoods') || '[]');
                    const all = { ...foodDB, ...customFoods };
                    deletedFoods.forEach(name => { delete all[name]; });
                    return all;
                }

                // Application state
                window.state = {
                    currentMeal: null,
                    selectedFoods: { Desayuno: [], Almuerzo: [], Cena: [], Snacks: [] },
                    savedDiets: {},
                    currentDietIndex: 0,
                    theme: localStorage.getItem('theme') || 'light',
                    selectedFoodsInModal: [],
                    currentShoppingList: 'weekly',
                    userMacros: null,
                    lastAddedItems: [],
                    showMacroResults: false,
                    userIntolerancias: JSON.parse(localStorage.getItem('userIntolerancias') || '[]'),
                    userData: {
                        age: '',
                        weight: '',
                        height: '',
                        gender: 'male',
                        activity: '1.2',
                        goal: 'maintain'
                    },
                    currentCategoryInModal: null,
                    mealSuggestions: {
                        Desayuno: [
                            { name: "Plátano", emoji: "🍌" },
                            { name: "Copos de avena", emoji: "🌾" }
                        ],
                        Almuerzo: [
                            { name: "Pechuga de pollo", emoji: "🍗" },
                            { name: "Arroz integral", emoji: "🍚" }
                        ],
                        Cena: [
                            { name: "Salmón fresco", emoji: "🐟" },
                            { name: "Brócoli", emoji: "🥦" }
                        ],
                        Snacks: [
                            { name: "Yogur griego natural", emoji: "🥛" }
                        ]
                    }
                };

                // ===== INITIALIZATION =====

                const init = () => {
                    setTheme(state.theme);
                    loadState();
                    setupEventListeners();
                    renderMeals();
                    renderSavedDiets();
                    getMacroContributors();
                    updateTotals();
                    generateShoppingList();
                    loadUserData();
                    updatePeriodLabel();
                    highlightActiveTab();
                    setupUserIntoleranciasBtns();
                };

                // Modal click outside handler
                document.getElementById('foodModal').addEventListener('click', e => {
                    if (e.target === document.getElementById('foodModal')) {
                        closeFoodModal();
                    }
                });

                // Macro input/select change handlers
                document.querySelectorAll('.macro-input, .macro-select').forEach(input => {
                    input.addEventListener('change', () => {
                        saveUserData();
                        saveState();
                    });
                });


                // ===== STATE MANAGEMENT =====

                const saveState = () => {
                    localStorage.setItem('dietState', JSON.stringify({
                        selectedFoods: state.selectedFoods,
                        savedDiets: state.savedDiets,
                        userData: state.userData,
                        userMacros: state.userMacros,
                        showMacroResults: state.showMacroResults,
                        currentDietId: state.currentDietId,
                        recipes: state.recipes
                    }));
                };



                const loadState = () => {
                    const saved = localStorage.getItem('dietState');
                    if (saved) {
                        const data = JSON.parse(saved);
                        state.savedDiets = data.savedDiets || {};
                        state.userMacros = data.userMacros || null;
                        state.showMacroResults = data.showMacroResults || false;
                        state.userData = data.userData || {
                            age: '',
                            weight: '',
                            height: '',
                            gender: 'male',
                            activity: '1.2',
                            goal: 'maintain'
                        };
                        state.currentDietId = data.currentDietId || Object.keys(state.savedDiets)[0];
                        state.recipes = data.recipes || [];

                        // Carga la dieta activa correctamente
                        if (state.currentDietId && state.savedDiets[state.currentDietId]) {
                            state.selectedFoods = JSON.parse(JSON.stringify(state.savedDiets[state.currentDietId]));
                            state.currentDietIndex = Object.keys(state.savedDiets).indexOf(state.currentDietId);
                        } else {
                            // Si no existe, crea una nueva dieta
                            const newName = 'Nueva Dieta 1';
                            state.savedDiets[newName] = { Desayuno: [], Almuerzo: [], Cena: [], Snacks: [] };
                            state.currentDietId = newName;
                            state.selectedFoods = { Desayuno: [], Almuerzo: [], Cena: [], Snacks: [] };
                            state.currentDietIndex = 0;
                        }
                    } else {
                        // Si no hay dietas, crea una nueva dieta
                        const newName = 'Nueva Dieta 1';
                        state.savedDiets = {};
                        state.savedDiets[newName] = { Desayuno: [], Almuerzo: [], Cena: [], Snacks: [] };
                        state.currentDietId = newName;
                        state.selectedFoods = { Desayuno: [], Almuerzo: [], Cena: [], Snacks: [] };
                        state.currentDietIndex = 0;
                        state.recipes = [
                            {
                                name: "Tortilla de Avena",
                                desc: "Mezcla avena, claras y canela. Cocina en sartén antiadherente.",
                                ingredients: [
                                    { food: "Claras", qty: 150 },
                                    { food: "Copos de avena", qty: 40 },
                                    { food: "Canela", qty: 2 }
                                ]
                            }
                        ];
                    }
                };

                const saveMealSuggestions = () => {
                    localStorage.setItem('mealSuggestions', JSON.stringify(state.mealSuggestions));
                };
                const loadMealSuggestions = () => {
                    const saved = localStorage.getItem('mealSuggestions');
                    if (saved) state.mealSuggestions = JSON.parse(saved);
                };

                const saveUserData = () => {
                    state.userData = {
                        age: document.getElementById('age').value,
                        weight: document.getElementById('weight').value,
                        height: document.getElementById('height').value,
                        gender: document.getElementById('gender').value,
                        activity: document.getElementById('activity').value,
                        goal: document.getElementById('goal').value
                    };
                    saveState();

                    // Comprobar si todos los campos requeridos están completos
                    const { age, weight, height } = state.userData;
                    if (age && weight && height) {
                        calculateMacros();
                    } else {
                        // Ocultar objetivos si falta algún dato
                        const results = document.getElementById('macro-results');
                        if (results) results.style.display = 'none';
                        state.userMacros = null;
                        state.showMacroResults = false;
                        updateTotals();
                    }
                };

                const loadUserData = () => {
                    document.getElementById('age').value = state.userData.age || '';
                    document.getElementById('weight').value = state.userData.weight || '';
                    document.getElementById('height').value = state.userData.height || '';
                    document.getElementById('gender').value = state.userData.gender;
                    document.getElementById('activity').value = state.userData.activity;
                    document.getElementById('goal').value = state.userData.goal;

                    const selected = document.getElementById('selected-activity');
                    const options = document.getElementById('activity-options');
                    if (selected && options) {
                        const opt = options.querySelector(`.option[data-value="${state.userData.activity}"]`);
                        if (opt) {
                            selected.innerHTML = `
                                <span class="activity-emoji">${opt.querySelector('.activity-emoji').textContent}</span>
                                ${opt.dataset.value}
                            `;
                        } else {
                            selected.innerHTML = '';
                        }
                    }

                    const { age, weight, height } = state.userData;
                    if (age && weight && height) {
                        calculateMacros();
                    } else {
                        // Oculta los objetivos si falta algún dato
                        const results = document.getElementById('macro-results');
                        if (results) results.style.display = 'none';
                        state.userMacros = null;
                        state.showMacroResults = false;
                        updateTotals();
                    }

                };

                // ===== UI RENDERING =====
                const highlightActiveTab = () => {
                    const weeklyTab = document.getElementById('weekly-tab');
                    const monthlyTab = document.getElementById('monthly-tab');

                    if (state.currentShoppingList === 'weekly') {
                        weeklyTab.classList.add('active');
                        monthlyTab.classList.remove('active');
                    } else {
                        monthlyTab.classList.add('active');
                        weeklyTab.classList.remove('active');
                    }
                };
                // ===== UI RENDERING =====
                const updatePeriodLabel = () => {
                    const label = document.getElementById('cost-period-label');
                    if (label) {
                        label.textContent = state.currentShoppingList === 'weekly' ? 'semanal' : 'mensual';
                    }
                };



                const setTheme = (theme) => {
                    document.documentElement.setAttribute('data-theme', theme);
                    localStorage.setItem('theme', theme);
                    state.theme = theme;
                };


                const renderMeals = () => {
                    const mealsContainer = document.getElementById('meals');
                    mealsContainer.innerHTML = '';

                    const meals = Object.keys(state.selectedFoods);

                    // Drop zone al principio
                    mealsContainer.appendChild(createMealDropZone(0));

                    for (let i = 0; i < meals.length; i++) {
                        const meal = meals[i];
                        const mealCard = createMealCard(meal);
                        mealsContainer.appendChild(mealCard);
                        renderMealContent(meal);

                        // Drop zone entre comidas
                        mealsContainer.appendChild(createMealDropZone(i + 1));
                    }
                };

                function createMealDropZone(index) {
                    const dropZone = document.createElement('div');
                    dropZone.className = 'meal-drop-zone';
                    dropZone.dataset.index = index;

                    dropZone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        dropZone.classList.add('active');
                    });
                    dropZone.addEventListener('dragleave', () => {
                        dropZone.classList.remove('active');
                    });
                    dropZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        dropZone.classList.remove('active');
                        const draggedMeal = e.dataTransfer.getData('text/plain');
                        if (draggedMeal) {
                            reorderMealsToIndex(draggedMeal, parseInt(dropZone.dataset.index, 10));
                        }
                    });
                    return dropZone;
                }

                const createMealCard = (meal) => {
                    const mealCard = document.createElement('div');
                    mealCard.className = 'meal-card';
                    mealCard.dataset.meal = meal;
                    mealCard.draggable = true;

                    // Drag events
                    mealCard.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', meal);
                        mealCard.classList.add('dragging');
                        // Colapsar todas, incluida la arrastrada
                        document.querySelectorAll('.meal-card').forEach(card => {
                            card.classList.add('collapsed');
                        });
                    });
                    mealCard.addEventListener('dragend', () => {
                        mealCard.classList.remove('dragging');
                        // Quitar el colapso de todas
                        document.querySelectorAll('.meal-card').forEach(card => {
                            card.classList.remove('collapsed');
                        });
                    });

                    // Permitir soltar sobre otras cards
                    mealCard.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        mealCard.classList.add('drag-over');
                    });
                    mealCard.addEventListener('dragleave', () => {
                        mealCard.classList.remove('drag-over');
                    });
                    mealCard.addEventListener('drop', (e) => {
                        e.preventDefault();
                        mealCard.classList.remove('drag-over');
                        const draggedMeal = e.dataTransfer.getData('text/plain');
                        if (draggedMeal && draggedMeal !== meal) {
                            reorderMeals(draggedMeal, meal);
                        }
                    });

                    const emoji = getMealEmoji(meal);
                    mealCard.innerHTML = `
                        <div class="meal-header" style="display:flex;align-items:center;gap:10px;">
                            <h3 style="margin:0;">${emoji} ${meal}</h3>
                            <div class="meal-macros"></div>
                            <button class="delete-meal-btn" onclick="App.deleteMeal('${meal}')">✖</button>
                        </div>
                        <div class="meal-content" id="${meal}-content"></div>
                        <div class="meal-suggestions" id="suggestions-${meal}">
                            <!-- Aquí irán los botones de sugerencia -->
                        </div>
                    `;

                    mealCard.addEventListener('mouseenter', () => {
                        App.showMealSuggestions(meal);
                    });
                    mealCard.addEventListener('mouseleave', () => {
                        App.hideMealSuggestions(meal);
                    });


                    mealCard.onclick = (e) => {
                        if (
                            e.target.classList.contains('delete-meal-btn') ||
                            e.target.classList.contains('delete-btn') ||
                            e.target.classList.contains('quick-amount-btn') ||
                            e.target.closest('.quantity-input') ||
                            e.target.classList.contains('suggestion-btn') ||
                            e.target.classList.contains('edit-icon') ||
                            e.target.classList.contains('delete-icon') ||
                            e.target.closest('.suggestion-btn')
                        ) {
                            return;
                        }
                        state.currentMeal = meal;
                        showFoodModal();
                    };
                    return mealCard;
                };

                const showMealSuggestions = (meal) => {
                    const container = document.getElementById(`suggestions-${meal}`);
                    if (!container) return;
                    const suggestions = (state.mealSuggestions[meal] || []);
                    container.innerHTML = `
    <div style="margin-top:10px;margin-bottom:2px;font-weight:600;color:#3498db;font-size:1em;">Añadir rápidamente:</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${suggestions.map((sug, idx) => `
            <div class="suggestion-btn" title="${sug.name}"
                onclick="event.stopPropagation(); App.addSuggestionToMeal('${meal}', '${sug.name}', event)">
                <button class="delete-icon" title="Eliminar" onclick="event.stopPropagation(); App.deleteSuggestion('${meal}', ${idx}, event)">✖</button>
                <span class="suggestion-emoji">${sug.emoji}</span>
                <svg viewBox="0 0 100 100" class="suggestion-curved-text">
                    <defs>
                        <path id="curve-${meal}-${idx}" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                    </defs>
                    <text>
                        <textPath xlink:href="#curve-${meal}-${idx}" startOffset="50%" text-anchor="middle">
                            ${sug.name}
                        </textPath>
                    </text>
                </svg>
                <button class="edit-icon" title="Editar" onclick="event.stopPropagation(); App.editSuggestion('${meal}', ${idx}, event)">✏️</button>
            </div>
        `).join('')}
        <div class="suggestion-btn add-btn" title="Añadir sugerencia" onclick="event.stopPropagation(); App.addNewSuggestion('${meal}', event)">
            <svg class="plus-svg" viewBox="0 0 54 54">
                <circle class="circle" cx="27" cy="27" r="23" />
                <line class="plus" x1="27" y1="15" x2="27" y2="39"/>
                <line class="plus" x1="15" y1="27" x2="39" y2="27"/>
            </svg>
        </div>
    </div>
`;
                    container.classList.add('visible');
                };
                const hideMealSuggestions = (meal) => {
                    const container = document.getElementById(`suggestions-${meal}`);
                    if (container) container.classList.remove('visible');
                };

                const addSuggestionToMeal = (meal, foodName, event) => {
                    // Si el clic viene del botón de editar o eliminar, no hacer nada
                    if (event && (event.target.classList.contains('edit-icon') || event.target.classList.contains('delete-icon'))) return;
                    const allFoods = App.getAllFoods ? App.getAllFoods() : getAllFoods();
                    const food = allFoods[foodName];
                    if (!food) {
                        alert('El alimento no existe en la base de datos.');
                        return;
                    }
                    let exists = state.selectedFoods[meal].find(f => f.name === foodName);
                    if (exists) {
                        exists.quantity += 100;
                    } else {
                        state.selectedFoods[meal].push({
                            name: foodName,
                            quantity: 100,
                            ...food
                        });
                    }
                    if (state.currentDietId) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    saveState();
                    renderMeals();
                    updateTotals();
                    generateShoppingList();
                    App.showMealSuggestions(meal);
                };
                const addNewSuggestion = (meal, event) => {
                    event.stopPropagation();
                    // Abre el modal de selección de alimentos y al seleccionar uno lo añade como sugerencia
                    App.showFoodModal();
                    const originalToggle = App.toggleFoodSelection;
                    App.toggleFoodSelection = (foodName, event2) => {
                        const food = App.getAllFoods ? App.getAllFoods()[foodName] : getAllFoods()[foodName];
                        if (!state.mealSuggestions[meal]) state.mealSuggestions[meal] = [];
                        state.mealSuggestions[meal].push({ name: foodName, emoji: food?.emoji || "🍽️" });
                        App.saveMealSuggestions && App.saveMealSuggestions();
                        App.showMealSuggestions(meal);
                        App.toggleFoodSelection = originalToggle;
                        document.getElementById('foodModal').style.display = 'none';
                    };
                };
                const editSuggestion = (meal, idx, event) => {
                    event.stopPropagation();
                    // Abre el modal de selección de alimentos
                    state._editingSuggestion = { meal, idx };
                    App.openFoodSelectorForSuggestion();
                };
                const deleteSuggestion = (meal, idx, event) => {
                    event.stopPropagation();
                    if (!state.mealSuggestions[meal]) return;
                    state.mealSuggestions[meal].splice(idx, 1);
                    App.saveMealSuggestions && App.saveMealSuggestions();
                    App.showMealSuggestions(meal);
                };
                openFoodSelectorForSuggestion: () => {
                    // Abre el modal de alimentos y cuando el usuario elija uno, lo pone como sugerencia
                    App.showFoodModal();
                    // Sobrescribe el handler de selección temporalmente
                    const originalToggle = App.toggleFoodSelection;
                    App.toggleFoodSelection = (foodName, event) => {
                        const { meal, idx } = state._editingSuggestion;
                        const food = App.getAllFoods ? App.getAllFoods()[foodName] : getAllFoods()[foodName];
                        state.mealSuggestions[meal][idx] = { name: foodName, emoji: food?.emoji || "🍽️" };
                        App.saveMealSuggestions && App.saveMealSuggestions();
                        App.showMealSuggestions(meal);
                        // Limpia el handler y cierra el modal
                        App.toggleFoodSelection = originalToggle;
                        document.getElementById('foodModal').style.display = 'none';
                    };
                },
                    function reorderMeals(draggedMeal, targetMeal) {
                        const meals = Object.keys(state.selectedFoods);
                        const from = meals.indexOf(draggedMeal);
                        const to = meals.indexOf(targetMeal);
                        if (from === -1 || to === -1) return;

                        // Reordena el array
                        meals.splice(to, 0, meals.splice(from, 1)[0]);

                        // Reconstruye el objeto en el nuevo orden
                        const newSelectedFoods = {};
                        meals.forEach(m => newSelectedFoods[m] = state.selectedFoods[m]);
                        state.selectedFoods = newSelectedFoods;

                        // Guarda y renderiza
                        if (state.currentDietId) {
                            state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                        }
                        saveState();
                        renderMeals();
                        updateTotals();
                        generateShoppingList();
                    }

                const getMealEmoji = (meal) => {
                    return meal === 'Desayuno' ? '☀️' :
                        meal === 'Almuerzo' ? '🥗' :
                            meal === 'Cena' ? '🌙' : '🍎';
                };

                const createAddMealButton = (index) => {
                    const addBtn = document.createElement('button');
                    addBtn.className = 'add-meal-btn';
                    addBtn.onclick = () => {
                        const mealName = Object.keys(state.selectedFoods)[index];
                        state.currentMeal = mealName; // Establecer la comida actual
                        showFoodModal(); // Abrir el modal para seleccionar alimentos
                        if (newMealName && newMealName.trim()) {
                            const mealName = newMealName.trim();
                            const meals = Object.keys(state.selectedFoods);
                            meals.splice(index + 1, 0, mealName); // Insertar en la posición clicada
                            state.selectedFoods = meals.reduce((acc, meal) => {
                                acc[meal] = state.selectedFoods[meal] || [];
                                return acc;
                            }, {});
                            saveState();
                            renderMeals();
                            updateTotals();
                            generateShoppingList();
                        }
                    };
                    return addBtn;
                };

                const renderMealContent = (meal) => {
                    const mealContent = document.getElementById(`${meal}-content`);
                    if (!mealContent) return;

                    const mealTotals = calculateTotals(state.selectedFoods[meal]);
                    updateMealMacros(meal, mealTotals);

                    // Render food items
                    if (state.selectedFoods[meal].length === 0) {
                        mealContent.innerHTML = '<p style="color: #999;">Clica en cualquier lugar para añadir un alimento</p>';
                        return;
                    }

                    mealContent.innerHTML = state.selectedFoods[meal].map(food =>
                        createFoodItemHTML(food, meal)
                    ).join('');
                };

                const updateMealMacros = (meal, totals) => {
                    const mealCard = document.querySelector(`.meal-card[data-meal="${meal}"]`);
                    if (!mealCard) return;

                    let macroContainer = mealCard.querySelector('.meal-macros');
                    if (!macroContainer) {
                        macroContainer = document.createElement('div');
                        macroContainer.className = 'meal-macros';
                        mealCard.querySelector('h3').after(macroContainer);
                    }

                    macroContainer.innerHTML = `
            <div class="macro-pill">🔥${totals.calories.toFixed(1)}</div>
            <div class="macro-pill">💪${totals.protein.toFixed(1)}g</div>
            <div class="macro-pill">🍞${totals.carbs.toFixed(1)}g</div>
            <div class="macro-pill">🥑${totals.fats.toFixed(1)}g</div>
            <div class="macro-pill">💵 $${totals.cost.toFixed(2)}</div>
        `;
                };

                const createFoodItemHTML = (food, meal) => {
                    const dbFood = getAllFoods()[food.name];
                    if (!dbFood) {
                        return `
            <div class="food-item" style="background:#ffeaea;border:1.5px solid #e74c3c;">
                <div class="food-info">
                    <button class="delete-btn" onclick="App.removeFood('${meal}', '${food.name}')">✖</button>
                    <div style="font-size: 1.2em">❓</div>
                    <div>
                        <div><strong style="color:#e74c3c;">${food.name}</strong></div>
                        <div style="color:#e74c3c;font-size:0.95em;">No existe en la base de datos</div>
                    </div>
                </div>
            </div>
        `;
                    }
                    return `
        <div class="food-item ${state.lastAddedItems.includes(food.name) ? 'new-item' : ''}">
            <div class="food-info">
                <button class="delete-btn" onclick="App.removeFood('${meal}', '${food.name}')">✖</button>
                <div style="font-size: 1.2em">${dbFood.emoji}</div>
                <div>
                    <div><strong>${food.name}</strong></div>
                    <div class="quantity-actions" style="margin-top: 5px;">
                        <input type="number" value="${food.quantity}" 
                            class="quantity-input"
                            onchange="App.updateQuantity('${meal}', '${food.name}', this.value)"
                            min="0" step="1">
                        <span>g</span>
                    </div>
                </div>
            </div>
            
            <div class="food-macros-actions">
                <div class="macros-cost-container">
                    <div class="macros-grid">
                        <div class="macro-badge calories">🔥 ${(food.calories * food.quantity / 100).toFixed(1)} kcal</div>
                        <div class="macro-badge protein">💪 ${(food.protein * food.quantity / 100).toFixed(1)}g</div>
                        <div class="macro-badge carbs">🍞 ${(food.carbs * food.quantity / 100).toFixed(1)}g</div>
                        <div class="macro-badge fats">🥑 ${(food.fats * food.quantity / 100).toFixed(1)}g</div>
                    </div>
                    <div class="cost-badge">
                        <div>💵</div>
                        <div>$${(food.price * food.quantity / 1000).toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="quick-amount-vertical">
                    <button class="quick-amount-btn add" onclick="App.updateQuantity('${meal}', '${food.name}', ${food.quantity + 50})">+50 g</button>
                    <button class="quick-amount-btn remove" onclick="App.updateQuantity('${meal}', '${food.name}', ${Math.max(0, food.quantity - 50)})">-50 g</button>
                </div>
            </div>
        </div>
    `;
                };

                // Buscador dinámico para ingredientes en el editor de recetas
                const setupIngredientFoodSearch = () => {
                    const input = document.getElementById('ingredient-food-search');
                    const datalist = document.getElementById('ingredient-food-list');
                    if (!input || !datalist) return;

                    input.addEventListener('input', function () {
                        const value = this.value.trim().toLowerCase();
                        const allFoods = getAllFoods();
                        datalist.innerHTML = Object.keys(allFoods)
                            .filter(name => name.toLowerCase().includes(value))
                            .slice(0, 20)
                            .map(name => `<option value="${name}">${allFoods[name].emoji} ${name}</option>`)
                            .join('');
                    });
                };

                const renderSavedDiets = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    const currentDietName = dietNames[state.currentDietIndex] || 'Mi primera dieta';
                    document.getElementById('current-diet-title').textContent = currentDietName;
                };

                // ===== MODAL MANAGEMENT =====

                const showFoodModal = () => {
                    state.currentCategoryInModal = null;
                    const modal = document.getElementById('foodModal');
                    const content = document.getElementById('modalContent');
                    updateModalHeights();

                    // Estructura fija de columnas
                    content.innerHTML = `
        <div class="modal-columns-wrapper" style="display:flex;gap:20px;">
            <div id="modal-selection-column" class="modal-column selection-column"></div>
            <div class="modal-column selected-column">
                <div style="padding: 20px; padding-bottom: 10px;">
                    <h3>🛒 Seleccionados (<span id="selected-count"></span>)</h3>
                    <div id="selected-totals"></div>
                </div>
                <div id="modal-selected-list"></div>
                <div class="add-button-container" id="add-button-container"></div>
            </div>
        </div>
    `;

                    // Renderiza categorías en la columna de selección
                    document.getElementById('modal-selection-column').innerHTML = createCategorySelectionHTML();
                    setupUserIntoleranciasBtns();
                    renderSelectedColumn();
                    modal.style.display = 'flex';
                };

                const createCategorySelectionHTML = () => {
                    return `
    <div style="display:flex;align-items:center;gap:10px;position:relative;">
        <h2 style="margin:0;">Categorías</h2>
        <span style="position:relative;flex:1;">
            <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#888;font-size:1.1em;">🔍</span>
            <input 
                id="food-search-input"
                type="text"
                placeholder="Buscar alimento..."
                style="padding:6px 32px 6px 32px;border-radius:6px;border:1.5px solid #ccc;font-size:1em;width:100%;"
                oninput="App.handleFoodSearch(this.value)"
                autocomplete="off"
            >
            <button 
                id="food-search-clear"
                style="display:none;position:absolute;right:5px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:1.1em;color:#e74c3c;"
                onclick="document.getElementById('food-search-input').value='';App.handleFoodSearch('');return false;"
                tabindex="-1"
                aria-label="Limpiar búsqueda"
            >✖</button>
        </span>
    </div>
    <!-- Panel para que el usuario marque sus intolerancias -->
            <div class="intolerancias-menu modal-intolerancias-menu">
                <div class="intolerancias-header"
                    onclick="if (!event.target.closest('.intolerancia-btn')) this.parentElement.classList.toggle('open')">
                    Intolerancias <span style="font-size:1.2em;">⚠️</span>                
                </div>
                <div class="intolerancias-content">
                    <div class="intolerancias-btn-group">
                        <!-- Tus botones de intolerancia aquí -->
                        <button type="button" class="intolerancia-btn" data-value="gluten">
                            <span class="intolerancia-emoji">🌾</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-gluten" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-gluten" startOffset="50%" text-anchor="middle">Gluten
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="lactosa">
                            <span class="intolerancia-emoji">🥛</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-lactosa" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-lactosa" startOffset="50%" text-anchor="middle">
                                        Lactosa
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="frutos secos">
                            <span class="intolerancia-emoji">🌰</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-frutossecos" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-frutossecos" startOffset="50%" text-anchor="middle">
                                        Frutos
                                        secos</textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="huevo">
                            <span class="intolerancia-emoji">🥚</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-huevo" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-huevo" startOffset="50%" text-anchor="middle">Huevo
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="soja">
                            <span class="intolerancia-emoji">🌱</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-soja" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-soja" startOffset="50%" text-anchor="middle">Soja
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="marisco">
                            <span class="intolerancia-emoji">🦐</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-marisco" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-marisco" startOffset="50%" text-anchor="middle">
                                        Marisco
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                        <button type="button" class="intolerancia-btn" data-value="pescado">
                            <span class="intolerancia-emoji">🐟</span>
                            <svg viewBox="0 0 100 100" class="intolerancia-curved-text">
                                <defs>
                                    <path id="circle-pescado" d="M50,6 a44,44 0 1,0 0,88 a44,44 0 1,0 0,-88" />
                                </defs>
                                <text>
                                    <textPath xlink:href="#circle-pescado" startOffset="50%" text-anchor="middle">
                                        Pescado
                                    </textPath>
                                </text>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
    <button class="btn btn-success" style="margin:10px 0;width:100%;" onclick="App.openFoodEditor()">➕ Nuevo alimento</button>
    <div id="food-category-or-search">
        <div class="category-grid">
            ${Object.entries(categories).map(([name, emoji]) => `
                <div class="category-card" onclick="App.showFoods('${name}')"
                    style="background: ${getCategoryColor(name)}">
                    <div style="font-size: 2em">${emoji}</div>
                    ${name}
                </div>
            `).join('')}
            <div class="category-card" onclick="App.showFoods('Personalizados')" style="background:rgba(159,90,253,0.08)">
                <div style="font-size:2em">📝</div>
                Personalizados
            </div>
        </div>
    </div>
    `;
                };

                const removeDiacritics = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const renderSelectedColumn = () => {
                    // Actualiza el número de seleccionados
                    const count = document.getElementById('selected-count');
                    if (count) count.textContent = state.selectedFoodsInModal.length;

                    // Actualiza los totales
                    const totalsDiv = document.getElementById('selected-totals');
                    if (totalsDiv) totalsDiv.innerHTML = createSelectedTotalsHTML(calculateTotals(state.selectedFoodsInModal));

                    // Actualiza la lista de seleccionados y mantiene el scroll
                    const selectedList = document.getElementById('modal-selected-list');
                    if (selectedList) {
                        const prevScroll = selectedList.scrollTop;
                        selectedList.innerHTML = createSelectedFoodsListHTML();
                        selectedList.scrollTop = prevScroll;
                    }

                    // Actualiza el botón de añadir
                    const addBtnContainer = document.getElementById('add-button-container');
                    if (addBtnContainer) addBtnContainer.innerHTML = createAddButtonHTML();

                    // Limpia la animación "new-item" después de renderizar
                    setTimeout(() => {
                        state.selectedFoodsInModal.forEach(item => { if (item.isNew) item.isNew = false; });
                    }, 400); // 400ms es igual o mayor que la duración de la animación
                };

                const handleFoodSearch = (query) => {
                    const container = document.getElementById('food-category-or-search');
                    const searchInput = document.getElementById('food-search-input');
                    const search = removeDiacritics(query.trim().toLowerCase());

                    if (!search) {
                        // Si está vacío, muestra las categorías
                        container.innerHTML = `
            <div class="category-grid">
                ${Object.entries(categories).map(([name, emoji]) => `
                    <div class="category-card" onclick="App.showFoods('${name}')"
                        style="background: ${getCategoryColor(name)}">
                        <div style="font-size: 2em">${emoji}</div>
                        ${name}
                    </div>
                `).join('')}
            </div>
        `;
                        // NO return aquí, sigue para mostrar/ocultar la cruz
                    } else {
                        // Filtra alimentos por nombre ignorando tildes
                        const results = Object.entries(getAllFoods())
                            .filter(([name, data]) => removeDiacritics(name.toLowerCase()).includes(search))
                            .map(([name, data]) => ({ name, ...data }));

                        if (results.length === 0) {
                            container.innerHTML = `<div style="padding:20px;color:#888;">No se encontraron alimentos.</div>`;
                            // NO return aquí, sigue para mostrar/ocultar la cruz
                        } else {
                            container.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <button class="btn" onclick="
                        document.getElementById('food-search-input').value = '';
                        App.handleFoodSearch('');
                    ">← Volver a categorías</button>
                </div>
                <div class="food-grid">
                    ${results.map(food => `
                        <div class="food-item-modal 
    ${state.selectedFoodsInModal.some(f => f.name === food.name) ? 'selected' : ''}
    ${(food.intolerancias && food.intolerancias.some(intol => state.userIntolerancias.includes(intol))) ? 'intolerant-food' : ''}" 
    onclick="App.toggleFoodSelection('${food.name}', event)">
                            <div style="font-size: 1.5em"><span class="food-emoji">${food.emoji}</span></div>
                            <div><strong>${food.name}</strong></div>
                            <div class="food-macros">
                                <div>🔥 ${food.calories}kcal/100g</div>
                                <div>💪 ${food.protein}g</div>
                                <div>🍞 ${food.carbs}g</div>
                                <div>🥑 ${food.fats}g</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
                        }
                    }

                    // Mostrar u ocultar la cruz según si hay texto
                    const clearBtn = document.getElementById('food-search-clear');
                    if (clearBtn) {
                        clearBtn.style.display = query.trim() ? 'block' : 'none';
                    }

                    // Actualiza la columna de seleccionados SIEMPRE
                    const selectedColumn = document.querySelector('.modal-column.selected-column');
                    if (selectedColumn) {
                        const selectedTotals = calculateTotals(state.selectedFoodsInModal);
                        const selectedList = document.getElementById('modal-selected-list');
                        if (selectedList) {
                            const prevScroll = selectedList.scrollTop;
                            selectedList.innerHTML = createSelectedFoodsListHTML();
                            selectedList.scrollTop = prevScroll;
                        }
                        const addBtnContainer = selectedColumn.querySelector('.add-button-container');
                        if (addBtnContainer) addBtnContainer.innerHTML = createAddButtonHTML();
                        const totalsDiv = selectedColumn.querySelector('.selected-totals');
                        if (totalsDiv) totalsDiv.outerHTML = createSelectedTotalsHTML(selectedTotals);
                    }
                    renderSelectedColumn();
                };

                const createSelectedTotalsHTML = (totals) => {
                    if (state.selectedFoodsInModal.length === 0) return '';
                    return `
        <div class="selected-totals" style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin: 10px 0;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 5px; font-size: 0.9em;">
                <div>🔥 Calorías: ${totals.calories.toFixed(1)}</div>
                <div>💪 Proteína: ${totals.protein.toFixed(1)}g</div>
                <div>🍞 Carbos: ${totals.carbs.toFixed(1)}g</div>
                <div>🥑 Grasas: ${totals.fats.toFixed(1)}g</div>
            </div>
        </div>
    `;
                };

                const createSelectedFoodsListHTML = () => {
                    return state.selectedFoodsInModal.map(food => `
        <div class="modal-selected-item ${food.isNew ? 'new-item' : ''}" data-food="${food.name}" style="padding:10px 4px 10px 4px; margin-right:2px;">
            <!-- Fila 1: Cruz, emoji, nombre, coste -->
            <div style="display: flex; align-items: center; gap: 0px; margin-bottom: 6px;">
                <button class="delete-btn" onclick="App.toggleFoodSelection('${food.name}', event)" 
                    style="margin-right:0px;">✖</button>
                <span class="food-emoji" style="font-size:1.2em; min-width:32px;">${food.emoji}</span>
                <span style="font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                    ${food.name}
                </span>
                <span class="macro-badge cost" style="background:none;margin-left:8px; display:flex; align-items:center;">
                    <span>💵</span><span style="margin-left:2px;">${(food.price * food.quantity / 1000).toFixed(2)}€</span>
                </span>
            </div>
            <!-- Fila 2: Macros a la izquierda, gramos a la derecha -->
            <div style="display: flex; align-items: center; gap: 4px;">
                <span class="macro-badge calories"><span>🔥</span><span style="margin-left:2px;">${Math.round(food.calories * food.quantity / 100)}</span></span>
                <span class="macro-badge protein"><span>💪</span><span style="margin-left:2px;">${Math.round(food.protein * food.quantity / 100)}</span></span>
                <span class="macro-badge carbs"><span>🍞</span><span style="margin-left:2px;">${Math.round(food.carbs * food.quantity / 100)}</span></span>
                <span class="macro-badge fats"><span>🥑</span><span style="margin-left:2px;">${Math.round(food.fats * food.quantity / 100)}</span></span>
                <span style="display:flex; align-items:center; gap:2px; margin-left:auto;">
                    <input type="number" 
                        value="${food.quantity}"
                        class="quantity-input"
                        style="width:50px;"
                        onchange="App.updateModalQuantity('${food.name}', this.value)"
                        min="0">
                    <span style="font-size:0.95em;color:#888;">g</span>
                </span>
            </div>
        </div>
    `).join('');
                };

                // ===== RECETAS =====


                let editingRecipeIndex = null;
                let tempIngredients = [];
                const deleteRecipe = idx => {
                    if (confirm('¿Seguro que quieres eliminar esta receta?')) {
                        state.recipes.splice(idx, 1);
                        saveState();
                        renderRecipesList();
                    }
                };
                const openRecipesModal = () => {
                    document.getElementById('recipesModal').style.display = 'flex';
                    renderRecipesList();
                    document.getElementById('recipe-search-input').value = '';
                };
                const closeRecipesModal = () => {
                    document.getElementById('recipesModal').style.display = 'none';
                };
                const renderRecipesList = () => {
                    const search = (document.getElementById('recipe-search-input').value || '').toLowerCase();
                    const list = document.getElementById('recipes-list');
                    let filtered = state.recipes.filter(r => r.name.toLowerCase().includes(search));
                    if (filtered.length === 0) {
                        list.innerHTML = `<div style="color:#888;padding:20px;">No hay recetas.</div>`;
                        return;
                    }
                    list.innerHTML = `
    <div class="category-grid">
        ${filtered.map((r, i) => {
                        // Calcular macros totales de la receta
                        const totals = r.ingredients.reduce((acc, ing) => {
                            const f = getAllFoods()[ing.food];
                            if (!f) return acc;
                            acc.calories += (f.calories * ing.qty / 100);
                            acc.protein += (f.protein * ing.qty / 100);
                            acc.carbs += (f.carbs * ing.qty / 100);
                            acc.fats += (f.fats * ing.qty / 100);
                            return acc;
                        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
                        return `
            <div class="category-card" style="position:relative; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:180px;" onclick="App.openRecipeDetail(${i})">
                <button class="btn btn-primary" style="position:absolute;top:6px;left:6px;padding:2px 8px;font-size:0.95em;z-index:2;"
                    onclick="event.stopPropagation();App.openRecipeEditor(${i})">✏️</button>
                <button class="btn btn-danger" style="position:absolute;top:6px;right:6px;padding:2px 8px;font-size:0.95em;z-index:2;"
                    onclick="event.stopPropagation();App.deleteRecipe(${i})">🗑️</button>
                <div style="font-size:2em;margin-bottom:4px;">🍽️</div>
                <div style="font-weight:600;margin-bottom:6px;">${r.name}</div>
                <div style="display:flex;justify-content:center;gap:10px;font-size:1em;color:#2176ae; margin-top:auto; padding-top:10px;">
                    <span title="Calorías">🔥${Math.round(totals.calories)}</span>
                    <span title="Proteína">💪${Math.round(totals.protein)}</span>
                    <span title="Carbohidratos">🍞${Math.round(totals.carbs)}</span>
                    <span title="Grasas">🥑${Math.round(totals.fats)}</span>
                </div>
            </div>
            `;
                    }).join('')}
    </div>
`;
                };
                const openRecipeDetail = idx => {
                    const r = state.recipes[idx];
                    let meals = Object.keys(state.selectedFoods);
                    document.getElementById('recipe-detail-body').innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-bottom:10px;">
    <button class="btn" title="Editar" style="background:#f5fafd;border:0px solid #e3f0ff;color:#3498db;padding:6px 10px;border-radius:25%;font-size:1.2em;"
        onclick="App.openRecipeEditor(${idx})">✏️</button>
    <button class="btn" title="Eliminar" style="background:#fff0f0;border:0px solid #f8d7da;color:#e74c3c;padding:6px 10px;border-radius:25%;font-size:1.2em;"
        onclick="App.deleteRecipe(${idx}); App.closeRecipeDetail();">🗑️</button>
    </div>
        <h2 style="margin: 0 auto; text-align: center; width: 100%;">${r.name}</h2>
        <button class="btn" onclick="App.closeRecipeDetail()" style="margin-left:10px;align-self:flex-start;">✖</button>
    </div>
    <div style="margin-bottom:18px;">
        <div style="font-weight:600;color:#3498db;margin-bottom:6px;">Ingredientes:</div>
        <ul style="margin-bottom:0;padding-left:18px;">
            ${r.ingredients.map(ing => {
                        if (!getAllFoods()[ing.food]) {
                            return `<li style="margin-bottom:4px;color:#e74c3c;"><b>${ing.food}</b> <span style="color:#888;">- ${ing.qty}g</span> <span style="color:#e74c3c;">(No existe en la base de datos)</span></li>`;
                        }
                        return `${getAllFoods()[ing.food]?.emoji || ''} <b>${ing.food}</b> <span style="color:#888;">- ${ing.qty}g</span>`;
                    }).join('')}
        </ul>
    </div>
    <div style="margin-bottom:18px;">
        <div style="font-weight:600;color:#3498db;margin-bottom:6px;">Pasos / Preparación:</div>
        <div style="color:#555;white-space:pre-line;">${r.desc || '<span style="color:#aaa;">Sin descripción</span>'}</div>
    </div>
    <div>
        <div style="font-weight:600;color:#3498db;margin-bottom:6px;">Añadir todos los ingredientes a:</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${meals.map(meal => `
                <button class="btn recipe-add-btn recipe-add-btn-${removeDiacritics(meal.toLowerCase())}" onclick="App.addRecipeToMeal(${idx},'${meal}')">
                    ${getMealEmoji(meal)} <span>${meal}</span>
                </button>
            `).join('')}
        </div>
    </div>
`;
                    const modal = document.getElementById('recipeDetailModal');
                    modal.style.display = 'flex';
                    // Forzar reflow
                    void modal.offsetWidth;
                };
                const closeRecipeDetail = () => {
                    document.getElementById('recipeDetailModal').style.display = 'none';
                };
                const addRecipeToMeal = (idx, meal) => {
                    const r = state.recipes[idx];
                    let missingIngredients = [];
                    r.ingredients.forEach(ing => {
                        if (!getAllFoods()[ing.food]) {
                            missingIngredients.push(ing.food);
                            return; // No añadir si no existe
                        }
                        // Si ya existe el alimento, suma la cantidad
                        let exists = state.selectedFoods[meal].find(f => f.name === ing.food);
                        if (exists) {
                            exists.quantity += ing.qty;
                        } else {
                            state.selectedFoods[meal].push({
                                name: ing.food,
                                quantity: ing.qty,
                                ...getAllFoods()[ing.food]
                            });
                        }
                    });

                    if (missingIngredients.length > 0) {
                        alert(
                            "Los siguientes ingredientes no existen en la base de datos y no se han añadido:\n\n" +
                            missingIngredients.join(", ")
                        );
                    }

                    if (state.currentDietId) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    saveState();
                    renderMeals();
                    updateTotals();
                    generateShoppingList();
                    closeRecipeDetail();
                    closeRecipesModal();
                };
                const openRecipeEditor = (idx = null) => {
                    editingRecipeIndex = idx;
                    tempIngredients = idx !== null && state.recipes[idx] ? [...state.recipes[idx].ingredients] : [];
                    document.getElementById('recipe-editor-title').textContent = idx !== null ? 'Editar Receta' : 'Crear Receta';
                    document.getElementById('recipe-name-input').value = idx !== null ? state.recipes[idx].name : '';
                    document.getElementById('recipe-desc-input').value = idx !== null ? state.recipes[idx].desc : '';
                    renderRecipeIngredientsList();
                    setupIngredientFoodSearch();
                    setTimeout(() => {
                        document.getElementById('recipeEditorModal').style.display = 'flex';
                    }, 0);
                };
                const closeRecipeEditor = () => {
                    document.getElementById('recipeEditorModal').style.display = 'none';
                };
                const renderRecipeIngredientsList = () => {
                    document.getElementById('recipe-ingredients-list').innerHTML = tempIngredients.length === 0
                        ? '<div style="color:#888;">Sin ingredientes</div>'
                        : tempIngredients.map((ing, i) => `
            <div>
                <span>${getAllFoods()[ing.food]?.emoji || ''} <b>${ing.food}</b> <span style="color:#888;">- ${ing.qty}g</span></span>
                <button class="btn btn-danger" onclick="App.removeIngredientFromRecipe(${i})">✖</button>
            </div>
        `).join('');
                };
                const addIngredientToRecipe = () => {
                    const food = document.getElementById('ingredient-food-search').value;
                    const qty = parseInt(document.getElementById('ingredient-qty-input').value);
                    if (!getAllFoods()[food] || !qty || qty <= 0) return;
                    tempIngredients.push({ food, qty });
                    renderRecipeIngredientsList();
                    document.getElementById('ingredient-food-search').value = '';
                    document.getElementById('ingredient-qty-input').value = '';
                };
                const removeIngredientFromRecipe = idx => {
                    tempIngredients.splice(idx, 1);
                    renderRecipeIngredientsList();
                    setupIngredientFoodSearch();
                };
                const saveRecipe = () => {
                    const name = document.getElementById('recipe-name-input').value.trim();
                    const desc = document.getElementById('recipe-desc-input').value.trim();
                    if (!name || !Array.isArray(tempIngredients) || tempIngredients.length === 0) {
                        alert('Pon un nombre y al menos un ingrediente.');
                        return;
                    }
                    if (editingRecipeIndex !== null) {
                        state.recipes[editingRecipeIndex] = { name, desc, ingredients: [...tempIngredients] };
                    } else {
                        state.recipes.push({ name, desc, ingredients: [...tempIngredients] });
                    }
                    closeRecipeEditor();
                    renderRecipesList();
                    saveState();
                };

                const createAddButtonHTML = () => {
                    if (state.selectedFoodsInModal.length === 0) return '';

                    return `
            <button class="btn btn-primary" onclick="App.addSelectedFoods()" 
                style="width: 100%; margin-top: 20px; padding: 12px; font-size: 1.1em;">
                ➕ Añadir a ${state.currentMeal}
            </button>
        `;
                };

                const showFoods = (category) => {
                    console.log('showFoods llamada con', category);
                    const content = document.getElementById('modalContent');
                    // Guarda la categoría activa para navegación correcta
                    state.currentCategoryInModal = category;

                    // Filtra los alimentos de la categoría
                    let foodsInCategory;
                    if (category === 'Personalizados') {
                        foodsInCategory = Object.entries(customFoods)
                            .map(([name, data]) => ({ name, ...data }));
                    } else {
                        foodsInCategory = Object.entries(getAllFoods())
                            .filter(([name, data]) => data.category === category)
                            .map(([name, data]) => ({ name, ...data }));
                    }

                    const selectedTotals = calculateTotals(state.selectedFoodsInModal);

                    content.innerHTML = `
        <div class="modal-column selection-column">
            <button class="btn" onclick="App.goToCategories()"
    style="margin-bottom: 15px; display: flex; align-items: center; gap: 5px;">
    ← Volver a categorías
</button>
            <h2>${category}</h2>
            <div class="food-grid">
                ${foodsInCategory.map(food => {
                        const isIntolerant = food.intolerancias && food.intolerancias.some(intol => state.userIntolerancias.includes(intol));
                        return `
                <div class="food-item-modal 
                    ${state.selectedFoodsInModal.some(f => f.name === food.name) ? 'selected' : ''} ${isIntolerant ? 'intolerant-food' : ''}" 
                    onclick="App.toggleFoodSelection('${food.name}', event)"
                    style="position:relative; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-height:130px; padding:8px 4px;">
                    <button class="btn btn-primary" style="position:absolute;top:6px;left:6px;padding:2px 8px;font-size:0.95em;z-index:2;"
                        onclick="event.stopPropagation();App.openFoodEditor('${food.name}')">✏️</button>
                    <button class="btn btn-danger" style="position:absolute;top:6px;right:6px;padding:2px 8px;font-size:0.95em;z-index:2;"
                        onclick="event.stopPropagation();App.deleteCustomFood('${food.name}')">🗑️</button>
                    <div style="font-size:1.5em;margin-bottom:2px;text-align:center;"><span class="food-emoji">${food.emoji}</span></div>
                    <div style="font-weight:500;margin-bottom:2px;text-align:center;font-size:0.95em;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;text-overflow:ellipsis;min-height:2.6em;line-height:1.3em;">
                        ${food.name}
                    </div>
                    <div style="display:flex;justify-content:center;align-items:flex-end;gap:4px;width:100%;margin-top:auto;padding-top:4px;">
                        <div style="display:flex;flex-direction:column;align-items:center;min-width:24px;">
                            <span style="font-size:1.05em;">🔥</span>
                            <span style="font-size:0.90em;color:#e17055;">${food.calories}</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;min-width:24px;">
                            <span style="font-size:1.05em;">💪</span>
                            <span style="font-size:0.90em;color:#0984e3;">${food.protein}</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;min-width:24px;">
                            <span style="font-size:1.05em;">🍞</span>
                            <span style="font-size:0.90em;color:#fdcb6e;">${food.carbs}</span>
                        </div>
                        <div style="display:flex;flex-direction:column;align-items:center;min-width:24px;">
                            <span style="font-size:1.05em;">🥑</span>
                            <span style="font-size:0.90em;color:#00b894;">${food.fats}</span>
                        </div>
                    </div>
                </div>
                `;
                    }).join('')}
            </div>
        </div>
        
        <div class="modal-column selected-column">
            <div style="padding: 20px; padding-bottom: 10px;">
                <h3>🛒 Seleccionados (${state.selectedFoodsInModal.length})</h3>
                ${createSelectedTotalsHTML(selectedTotals)}
            </div>
            <div id="modal-selected-list">
                ${createSelectedFoodsListHTML()}
            </div>
            <div class="add-button-container">
                ${createAddButtonHTML()}
            </div>
        </div>
    `;
                };

                const closeFoodModal = () => {
                    document.getElementById('foodModal').style.display = 'none';
                };

                const updateModalHeights = () => {
                    const modalList = document.getElementById('modal-selected-list');
                    if (modalList) {
                        const viewportHeight = window.innerHeight;
                        modalList.style.maxHeight = `${viewportHeight * 0.6}px`;
                    }
                };

                // ===== FOOD SELECTION HANDLERS =====

                const toggleFoodSelection = (foodName, event) => {
                    const card = event?.currentTarget?.closest('.food-item-modal');
                    const isDeleteButton = event?.target?.closest('.delete-btn');
                    if (card && !isDeleteButton) {
                        // Animaciones
                        const emoji = card.querySelector('.food-emoji');
                        if (emoji) {
                            emoji.style.animation = 'none';
                            void emoji.offsetWidth;
                            emoji.style.animation = 'spinEmoji 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards';
                        }
                        card.classList.remove('clicked-animation');
                        void card.offsetWidth;
                        card.classList.add('clicked-animation');
                        renderSelectedColumn();
                    }

                    const existingIndex = state.selectedFoodsInModal.findIndex(f => f.name === foodName);

                    if (existingIndex > -1) {
                        state.selectedFoodsInModal.splice(existingIndex, 1);
                    } else {
                        state.selectedFoodsInModal.forEach(item => item.isNew = false);
                        state.selectedFoodsInModal.push({
                            name: foodName,
                            quantity: 100,
                            ...getAllFoods()[foodName],
                            isNew: true
                        });
                    }

                    // Refresca ambas columnas SIEMPRE
                    const modal = document.getElementById('foodModal');
                    const content = document.getElementById('modalContent');
                    if (modal && content) {
                        const searchInput = document.getElementById('food-search-input');
                        const searchValue = searchInput ? searchInput.value.trim() : '';
                        if (searchValue) {
                            handleFoodSearch(searchValue);
                        } else if (state.currentCategoryInModal) {
                            showFoods(state.currentCategoryInModal);
                        } else {
                            content.innerHTML = createCategorySelectionHTML();
                        }
                    }
                };

                const updateModalQuantity = (foodName, value) => {
                    const quantity = Math.max(0, parseInt(value) || 0);
                    const foodItem = state.selectedFoodsInModal.find(f => f.name === foodName);

                    if (foodItem) {
                        foodItem.quantity = quantity;
                        // Solo refresca la columna de seleccionados, no navegues
                        const selectedColumn = document.querySelector('.modal-column.selected-column');
                        if (selectedColumn) {
                            const selectedTotals = calculateTotals(state.selectedFoodsInModal);
                            const selectedList = selectedColumn.querySelector('#modal-selected-list');
                            if (selectedList) {
                                const prevScroll = selectedList.scrollTop;
                                selectedList.innerHTML = createSelectedFoodsListHTML();
                                selectedList.scrollTop = prevScroll;
                            }
                            const addBtnContainer = selectedColumn.querySelector('.add-button-container');
                            if (addBtnContainer) addBtnContainer.innerHTML = createAddButtonHTML();
                            const totalsDiv = selectedColumn.querySelector('.selected-totals');
                            if (totalsDiv) totalsDiv.outerHTML = createSelectedTotalsHTML(selectedTotals);
                        }
                    }
                    renderSelectedColumn();
                };

                const addSelectedFoods = () => {
                    const prevItems = new Set(state.selectedFoods[state.currentMeal].map(f => f.name));
                    const newItems = [];

                    state.selectedFoodsInModal.forEach(modalFood => {
                        const existingIndex = state.selectedFoods[state.currentMeal]
                            .findIndex(f => f.name === modalFood.name);

                        if (!prevItems.has(modalFood.name)) {
                            newItems.push(modalFood.name);
                        }

                        if (existingIndex > -1) {
                            state.selectedFoods[state.currentMeal][existingIndex].quantity += modalFood.quantity;
                        } else {
                            state.selectedFoods[state.currentMeal].push({
                                name: modalFood.name,
                                quantity: modalFood.quantity,
                                ...getAllFoods()[modalFood.name]
                            });
                        }
                    });

                    state.lastAddedItems = newItems;
                    state.selectedFoodsInModal = [];

                    closeFoodModal();

                    // ACTUALIZA LA DIETA ACTUAL EN savedDiets
                    if (state.currentDietId) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    saveState();
                    renderMeals();
                    updateTotals();
                    generateShoppingList();

                    setTimeout(() => {
                        state.lastAddedItems = [];
                        renderMeals();
                    }, 500);

                    setTimeout(() => {
                        state.selectedFoodsInModal.forEach(item => item.isNew = false);
                    }, 50);
                };

                const updateQuantity = (meal, food, value) => {
                    const quantity = Math.max(0, Number(value) || 0);
                    const item = state.selectedFoods[meal].find(i => i.name === food);

                    if (item) {
                        item.quantity = quantity;
                        // ACTUALIZA LA DIETA ACTUAL EN savedDiets
                        if (state.currentDietId) {
                            state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                        }
                        saveState();
                        renderMealContent(meal);
                        App.showMealSuggestions(meal);
                        updateTotals();
                        generateShoppingList();
                    }
                };

                addSuggestionToMeal: (meal, foodName, event) => {
                    // Si el clic viene del botón de editar, no hacer nada
                    if (event && event.target.classList.contains('edit-icon')) return;
                    const allFoods = App.getAllFoods ? App.getAllFoods() : getAllFoods();
                    const food = allFoods[foodName];
                    if (!food) {
                        alert('El alimento no existe en la base de datos.');
                        return;
                    }
                    let exists = state.selectedFoods[meal].find(f => f.name === foodName);
                    if (exists) {
                        exists.quantity += 100;
                    } else {
                        state.selectedFoods[meal].push({
                            name: foodName,
                            quantity: 100,
                            ...food
                        });
                    }
                    if (state.currentDietId) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    saveState();
                    renderMeals();
                    updateTotals();
                    generateShoppingList();
                };

                const removeFood = (meal, food) => {
                    state.selectedFoods[meal] = state.selectedFoods[meal].filter(f => f.name !== food);
                    // ACTUALIZA LA DIETA ACTUAL EN savedDiets
                    if (state.currentDietId) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    saveState();
                    renderMealContent(meal);
                    updateTotals();
                    generateShoppingList();
                };

                // ===== SHOPPING LIST =====
                const setupEventListeners = () => {
                    // Agregar cualquier evento global necesario aquí
                    console.log('Event listeners configurados');
                };
                const generateShoppingList = () => {
                    const allFoods = Object.values(state.selectedFoods).flat();
                    const foodQuantities = {};

                    allFoods.forEach(food => {
                        if (!foodQuantities[food.name]) foodQuantities[food.name] = 0;
                        const multiplier = state.currentShoppingList === 'weekly' ? 7 : 30;
                        foodQuantities[food.name] += food.quantity * multiplier;
                    });

                    const sortedFoods = Object.keys(foodQuantities).sort();
                    const listContent = document.getElementById('shopping-list-content');

                    if (sortedFoods.length === 0) {
                        listContent.innerHTML = '<div style="color: #999; text-align: center; padding: 10px;">No hay productos en la lista</div>';
                        return;
                    }

                    listContent.innerHTML = sortedFoods.map(food => `
            <div class="shopping-list-item">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${getAllFoods()[food]?.emoji || '❓'} ${food}
                    </div>
                    <div style="font-weight: bold;">${foodQuantities[food].toFixed(0)}g</div>
                </div>
            </div>
        `).join('');
                };

                const showShoppingList = (type, event) => {
                    state.currentShoppingList = type;
                    generateShoppingList();
                    updateTotals();
                    saveState();

                    updatePeriodLabel();

                    // Update active tabs
                    document.querySelectorAll('.shopping-list-tab').forEach(tab => {
                        tab.classList.remove('active');
                    });
                    event.currentTarget.classList.add('active');
                };




                // ===== DIET MANAGEMENT =====
                const deleteMeal = (meal) => {
                    if (confirm(`¿Estás seguro de eliminar la comida "${meal}"?`)) {
                        delete state.selectedFoods[meal];
                        saveState();
                        renderMeals();
                        updateTotals();
                        generateShoppingList();
                    }
                };
                const createNewDiet = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (state.currentDietIndex !== undefined && dietNames[state.currentDietIndex]) {
                        const currentDietName = dietNames[state.currentDietIndex];
                        state.savedDiets[currentDietName] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }

                    let baseName = 'Nueva Dieta';
                    let counter = 1;
                    while (state.savedDiets[`${baseName} ${counter}`]) {
                        counter++;
                    }
                    const newName = `${baseName} ${counter}`;
                    state.savedDiets[newName] = JSON.parse(JSON.stringify({
                        Desayuno: [],
                        Almuerzo: [],
                        Cena: [],
                        Snacks: []
                    }));

                    const newIndex = Object.keys(state.savedDiets).indexOf(newName);
                    loadDietByIndex(newIndex, true); // <--- NO guardar el estado actual
                    saveState();
                    renderSavedDiets();
                    if (typeof updateDietWeekdayButtons === 'function') updateDietWeekdayButtons();
                };

                const loadDiet = (name) => {
                    // Guarda la dieta actual antes de cambiar
                    if (state.currentDietId && state.savedDiets[state.currentDietId]) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }
                    if (state.savedDiets[name]) {
                        state.selectedFoods = JSON.parse(JSON.stringify(state.savedDiets[name]));
                        state.currentDietId = name;
                        saveState();
                        renderMeals();
                        updateTotals();
                        generateShoppingList();
                        document.getElementById('current-diet-title').textContent = name;
                    }
                };

                const loadDietByIndex = (index, skipSaveCurrent = false) => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (dietNames.length === 0) return;

                    // Guarda la dieta actual antes de cambiar, salvo que se indique lo contrario
                    if (!skipSaveCurrent && state.currentDietId && state.savedDiets[state.currentDietId]) {
                        state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }

                    state.currentDietIndex = index;
                    const dietName = dietNames[state.currentDietIndex];
                    state.selectedFoods = JSON.parse(JSON.stringify(state.savedDiets[dietName]));
                    state.currentDietId = dietName;
                    saveState();
                    renderMeals();
                    updateTotals();
                    generateShoppingList();
                    document.getElementById('current-diet-title').textContent = dietName;
                };

                const deleteCurrentDiet = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (dietNames.length <= 1) {
                        alert("No puedes eliminar la última dieta.");
                        return;
                    }
                    if (dietNames.length === 0) return;

                    const dietName = dietNames[state.currentDietIndex];
                    if (!confirm(`¿Estás seguro de que quieres eliminar la dieta "${dietName}"?`)) {
                        return;
                    }

                    delete state.savedDiets[dietName];
                    const newIndex = Math.max(0, state.currentDietIndex - 1);
                    loadDietByIndex(newIndex);
                    saveState();
                    renderSavedDiets();
                    if (typeof updateDietWeekdayButtons === 'function') updateDietWeekdayButtons();
                };

                const prevDiet = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (dietNames.length === 0) return;

                    const newIndex = (state.currentDietIndex - 1 + dietNames.length) % dietNames.length;
                    loadDietByIndex(newIndex);
                    if (typeof updateDietWeekdayButtons === 'function') updateDietWeekdayButtons();
                };

                const nextDiet = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (dietNames.length === 0) return;

                    const newIndex = (state.currentDietIndex + 1) % dietNames.length;
                    loadDietByIndex(newIndex);
                    if (typeof updateDietWeekdayButtons === 'function') updateDietWeekdayButtons();
                };

                const editDietName = () => {
                    const dietNames = Object.keys(state.savedDiets);
                    if (dietNames.length === 0) return;

                    // Guarda la dieta actual antes de renombrar
                    if (state.currentDietIndex !== undefined && dietNames[state.currentDietIndex]) {
                        const currentDietName = dietNames[state.currentDietIndex];
                        state.savedDiets[currentDietName] = JSON.parse(JSON.stringify(state.selectedFoods));
                    }

                    const oldName = dietNames[state.currentDietIndex];
                    const titleElement = document.getElementById('current-diet-title');

                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = oldName;
                    input.style = `
            font-size: inherit;
            font-family: inherit;
            color: inherit;
            background: var(--surface);
            border: 2px solid var(--secondary);
            border-radius: 5px;
            padding: 5px;
            width: 200px;
        `;

                    titleElement.innerHTML = '';
                    titleElement.appendChild(input);
                    input.focus();

                    const finishEditing = () => {
                        const newName = input.value.trim();
                        if (!newName || newName === oldName) {
                            titleElement.textContent = oldName;
                            return;
                        }

                        if (state.savedDiets[newName]) {
                            alert('¡Ya existe una dieta con ese nombre!');
                            titleElement.textContent = oldName;
                            return;
                        }

                        state.savedDiets[newName] = state.savedDiets[oldName];
                        delete state.savedDiets[oldName];
                        state.currentDietIndex = Object.keys(state.savedDiets).indexOf(newName);

                        titleElement.textContent = newName;
                        saveState();
                        renderSavedDiets();
                    };

                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') finishEditing();
                    });

                    input.addEventListener('blur', finishEditing);
                };

                // ===== MACRO CALCULATIONS =====

                const calculateMacros = () => {
                    // NO LLAMES a saveUserData() aquí

                    const age = parseInt(state.userData.age);
                    const weight = parseFloat(state.userData.weight);
                    const height = parseFloat(state.userData.height);
                    const gender = state.userData.gender;
                    const activity = state.userData.activity;
                    const goal = state.userData.goal;

                    if (!age || !weight || !height) {
                        // Ocultar objetivos si falta algún dato
                        const results = document.getElementById('macro-results');
                        if (results) results.style.display = 'none';
                        state.userMacros = null;
                        state.showMacroResults = false;
                        updateTotals();
                        return;
                    }

                    // Paso 1: Calcular TMB (Ecuación de Mifflin-St Jeor)
                    let bmr;
                    if (gender === 'male') {
                        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
                    } else {
                        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
                    }

                    // Paso 2: Ajustar TMB según el nivel de actividad y el objetivo
                    const activityFactors = {
                        Sedentario: 1.2,
                        Baja: 1.375,
                        Moderada: 1.55,
                        Alta: 1.725,
                        Extra: 1.9
                    };

                    const adjustment = {
                        "Pérdida de peso": -275,
                        Mantenimiento: 0,
                        "Ganancia muscular": 275
                    };

                    let tdee;
                    if (activityFactors[activity] !== undefined && adjustment[goal] !== undefined) {
                        tdee = bmr * activityFactors[activity] + adjustment[goal];
                    } else {
                        //alert('Nivel de actividad o objetivo no válido');
                        return;
                    }

                    // Paso 3: Calcular macronutrientes según el objetivo
                    let protein, fats, carbs;

                    if (goal === "Pérdida de peso") {
                        protein = weight * 2.0; // Proteínas en gramos

                        fats = (tdee * 0.25) / 9; // Grasas en gramos
                        carbs = (tdee - (protein * 4) - (fats * 9)) / 4; // Carbohidratos en gramos
                    } else if (goal === "Mantenimiento") {
                        protein = weight * 1.6; // Proteínas en gramos
                        fats = (tdee * 0.30) / 9; // Grasas en gramos
                        carbs = (tdee - (protein * 4) - (fats * 9)) / 4; // Carbohidratos en gramos
                    } else if (goal === "Ganancia muscular") {
                        protein = weight * 1.8; // Proteínas en gramos
                        fats = (tdee * 0.20) / 9; // Grasas en gramos
                        carbs = (tdee - (protein * 4) - (fats * 9)) / 4; // Carbohidratos en gramos
                    }

                    // Guardar los resultados en el estado
                    state.userMacros = {
                        calories: Math.round(tdee),
                        protein: parseFloat(protein.toFixed(2)),
                        carbs: parseFloat(carbs.toFixed(2)),
                        fats: parseFloat(fats.toFixed(2))
                    };

                    showMacroResults();
                    updateTotals();
                };

                const showMacroResults = () => {
                    const results = document.getElementById('macro-results');
                    results.style.display = 'block';

                    // Update target values display
                    document.getElementById('target-calories').textContent = state.userMacros.calories;
                    document.getElementById('target-protein').textContent = state.userMacros.protein;
                    document.getElementById('target-carbs').textContent = state.userMacros.carbs;
                    document.getElementById('target-fats').textContent = state.userMacros.fats;

                    state.showMacroResults = true;
                    saveState(); // Añadir esta línea para guardar el estado
                    updateTotals();
                };

                function getMacroContributors(macro) {
                    const foods = Object.values(state.selectedFoods).flat();
                    const contributors = [];
                    foods.forEach(food => {
                        let value = 0;
                        if (macro === 'calories') value = food.calories * food.quantity / 100;
                        if (macro === 'protein') value = food.protein * food.quantity / 100;
                        if (macro === 'carbs') value = food.carbs * food.quantity / 100;
                        if (macro === 'fats') value = food.fats * food.quantity / 100;
                        if (value > 0) {
                            contributors.push({
                                name: food.name,
                                emoji: getAllFoods()[food.name]?.emoji || '',
                                value
                            });
                        }
                    });
                    contributors.sort((a, b) => b.value - a.value);
                    return contributors;
                }


                const updateTotals = () => {
                    const totals = calculateTotals(Object.values(state.selectedFoods).flat());


                    // Apply multiplier to daily cost
                    const multiplier = state.currentShoppingList === 'weekly' ? 7 : 30;
                    const totalCost = totals.cost * multiplier;
                    document.getElementById('total-cost').textContent = totalCost.toFixed(2);

                    if (state.userMacros) {
                        document.getElementById('current-calories').textContent = totals.calories.toFixed(1);
                        document.getElementById('current-protein').textContent = totals.protein.toFixed(1);
                        document.getElementById('current-carbs').textContent = totals.carbs.toFixed(1);
                        document.getElementById('current-fats').textContent = totals.fats.toFixed(1);

                        updateProgress(totals.calories, state.userMacros.calories, 'calories-progress');
                        updateProgress(totals.protein, state.userMacros.protein, 'protein-progress');
                        updateProgress(totals.carbs, state.userMacros.carbs, 'carbs-progress');
                        updateProgress(totals.fats, state.userMacros.fats, 'fats-progress');
                    }

                    // Añadir tooltips a las barras de macros
                    ['calories', 'protein', 'carbs', 'fats'].forEach(macro => {
                        const bar = document.querySelector(`.progress-bar.${macro}`);
                        if (!bar) return;

                        // Busca el tooltip como hermano, no hijo
                        let tooltip = bar.parentElement.querySelector(`.progress-bar-tooltip.${macro}`);
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.className = `progress-bar-tooltip ${macro}`;
                            bar.parentElement.appendChild(tooltip);
                        }

                        const contributors = getMacroContributors(macro);
                        if (contributors.length === 0) {
                            tooltip.innerHTML = '<span style="color:#888;">No hay alimentos en la dieta</span>';
                        } else {
                            const max = Math.max(...contributors.map(f => f.value));
                            const min = Math.min(...contributors.map(f => f.value));
                            const colorStart = [231, 76, 60];   // Rojo
                            const colorEnd = [39, 174, 96];     // Verde

                            tooltip.innerHTML = `
    <div style="font-weight:600;color:#3498db;margin-bottom:4px;">
        Alimentos que aportan ${macro === 'calories' ? 'calorías' : macro === 'protein' ? 'proteína' : macro === 'carbs' ? 'carbohidratos' : 'grasas'}:
    </div>
    <ul style="margin:0 0 0 12px;padding:0;">
        ${contributors.map((f, idx) => {
                                // Degradado por posición en la lista
                                let percent;
                                if (contributors.length === 1) {
                                    percent = 1;
                                } else {
                                    percent = 1 - idx / (contributors.length - 1);
                                }
                                const r = Math.round(colorStart[0] + (colorEnd[0] - colorStart[0]) * percent);
                                const g = Math.round(colorStart[1] + (colorEnd[1] - colorStart[1]) * percent);
                                const b = Math.round(colorStart[2] + (colorEnd[2] - colorStart[2]) * percent);
                                const color = `rgb(${r},${g},${b})`;
                                return `
                <li style="margin-bottom:2px;">
                    ${f.emoji} <b>${f.name}</b>: 
                    <span style="color:${color};font-weight:600;">
                        ${macro === 'calories' ? f.value.toFixed(1) + ' kcal' : f.value.toFixed(1) + 'g'}
                    </span>
                </li>
            `;
                            }).join('')}
    </ul>
`;
                        }

                        // Oculta el tooltip por defecto
                        tooltip.style.display = 'none';

                        // Muestra el tooltip al pasar el ratón por la barra
                        bar.onmouseenter = () => {
                            tooltip.style.display = 'block';
                            // Posiciónalo justo encima de la barra
                            const barRect = bar.getBoundingClientRect();
                            const parentRect = bar.parentElement.getBoundingClientRect();
                            tooltip.style.position = 'absolute';
                            tooltip.style.left = (bar.offsetLeft + bar.offsetWidth / 2 - tooltip.offsetWidth / 2) + 'px';
                            tooltip.style.top = (bar.offsetTop - tooltip.offsetHeight + 230) + 'px';
                            tooltip.style.zIndex = 9999;
                        };
                        bar.onmouseleave = () => {
                            tooltip.style.display = 'none';
                        };
                    });
                };

                const updateProgress = (current, target, elementId) => {
                    const progressFill = document.getElementById(elementId);
                    const progressExcess = progressFill.parentElement.querySelector('.progress-excess');

                    const percentage = (current / target) * 100;
                    const fillWidth = Math.min(percentage, 100);
                    const excessWidth = Math.max(percentage - 100, 0);

                    progressFill.style.width = `${fillWidth}%`;
                    progressExcess.style.width = `${excessWidth}%`;

                    progressFill.style.borderRadius = fillWidth >= 100 ? '8px' : '8px 0 0 8px';
                    progressExcess.style.borderRadius = excessWidth > 0 ? '0 8px 8px 0' : '0';

                    progressExcess.style.clipPath = excessWidth > 0
                        ? `inset(0 ${100 - excessWidth}% 0 0)`
                        : 'inset(0 0 0 100%)';
                };

                // ===== PDF EXPORT =====

                const exportPDF = () => {
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF();

                    // Título principal
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(18);
                    pdf.text('Plan Dietético', 105, 15, { align: 'center' });

                    let y = 25;

                    // ====== TOTALES DIARIOS ======
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(0, 0, 0);
                    const title = 'Totales diarios';
                    pdf.text(title, 15, y);
                    const titleWidth = pdf.getTextWidth(title);
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.5);
                    pdf.line(15, y + 1.5, 15 + titleWidth, y + 1.5);
                    y += 9;

                    // Macros en una línea
                    const totals = calculateTotals(Object.values(state.selectedFoods).flat());
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(11);
                    pdf.setTextColor(80, 80, 80);
                    pdf.text(
                        `Calorías: ${totals.calories.toFixed(1)} kcal | Proteínas: ${totals.protein.toFixed(1)}g | Carbohidratos: ${totals.carbs.toFixed(1)}g | Grasas: ${totals.fats.toFixed(1)}g | Coste${totals.cost.toFixed(2)}€`,
                        20, y
                    );
                    y += 12;

                    // Línea divisoria al final de la sección
                    pdf.setDrawColor(180);
                    pdf.line(15, y, 195, y);
                    y += 7;

                    // ====== DIETA DETALLADA ======
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(0, 0, 0);
                    const titleDiet = 'Dieta';
                    pdf.text(titleDiet, 15, y);
                    const titleDietWidth = pdf.getTextWidth(titleDiet);
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.5);
                    pdf.line(15, y + 1.5, 15 + titleDietWidth, y + 1.5);
                    y += 9;

                    Object.entries(state.selectedFoods).forEach(([meal, foods]) => {
                        if (foods.length === 0) return;
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(12);
                        pdf.setTextColor(40, 40, 40);
                        pdf.text(`• ${meal}`, 18, y);
                        y += 6;

                        pdf.setFont('helvetica', 'normal');
                        pdf.setFontSize(11);
                        pdf.setTextColor(80, 80, 80);
                        foods.forEach(food => {
                            pdf.text(`${food.name} (${food.quantity}g)`, 25, y);
                            pdf.text(
                                `Cal: ${(food.calories * food.quantity / 100).toFixed(1)} | P: ${(food.protein * food.quantity / 100).toFixed(1)}g | C: ${(food.carbs * food.quantity / 100).toFixed(1)}g | G: ${(food.fats * food.quantity / 100).toFixed(1)}g`,
                                80, y
                            );
                            y += 6;
                            if (y > 270) { pdf.addPage(); y = 15; }
                        });
                        y += 3;
                    });

                    // Línea divisoria al final de la sección
                    pdf.setDrawColor(180);
                    pdf.line(15, y, 195, y);
                    y += 7;

                    // ====== LISTA DE LA COMPRA ======
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(14);
                    pdf.setTextColor(0, 0, 0);
                    const titleShopping = 'Lista de la compra';
                    pdf.text(titleShopping, 15, y);
                    const titleShoppingWidth = pdf.getTextWidth(titleShopping);
                    pdf.setDrawColor(0, 0, 0);
                    pdf.setLineWidth(0.5);
                    pdf.line(15, y + 1.5, 15 + titleShoppingWidth, y + 1.5);
                    y += 9;

                    // Calcula la lista de la compra igual que en la app
                    const multiplier = state.currentShoppingList === 'weekly' ? 7 : 30;
                    const allFoods = Object.values(state.selectedFoods).flat();
                    const foodQuantities = {};

                    allFoods.forEach(food => {
                        if (!foodQuantities[food.name]) foodQuantities[food.name] = 0;
                        foodQuantities[food.name] += food.quantity * multiplier;
                    });
                    const sortedFoods = Object.keys(foodQuantities).sort();

                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(11);
                    pdf.setTextColor(80, 80, 80);
                    sortedFoods.forEach(food => {
                        pdf.text(
                            `${food}: ${foodQuantities[food].toFixed(0)}g`,
                            20, y
                        );
                        y += 6;
                        if (y > 270) { pdf.addPage(); y = 15; }
                    });

                    // Línea divisoria al final de la sección
                    pdf.setDrawColor(180);
                    pdf.line(15, y, 195, y);

                    pdf.save('dieta.pdf');
                };

                // ===== HELPER FUNCTIONS =====



                const getCategoryColor = (category) => {
                    const colors = {
                        'Proteínas': 'rgba(246, 229, 141, 0.3)',
                        'Lácteos': 'rgba(126, 214, 223, 0.3)',
                        'Cereales': 'rgba(186, 220, 88, 0.3)',
                        'Tubérculos': 'rgba(222, 184, 135, 0.3)',
                        'Verduras': 'rgba(106, 176, 76, 0.3)',
                        'Frutas': 'rgba(255, 121, 121, 0.3)',
                        'Legumbres': 'rgba(210, 180, 140, 0.3)',
                        'Grasas': 'rgba(255, 190, 118, 0.3)',
                        'Bebidas': 'rgba(100, 149, 237, 0.3)',
                        'Especias': 'rgba(139, 69, 19, 0.3)',
                        'Endulzantes': 'rgba(255, 215, 0, 0.3)',
                        'Platos preparados': 'rgba(255, 165, 0, 0.3)'
                    };
                    return colors[category] || 'rgba(248, 249, 250, 0.3)';
                };

                const addMeal = () => {
                    const newMealName = prompt('Nombre de la nueva comida:');
                    if (newMealName && newMealName.trim()) {
                        const mealName = newMealName.trim();
                        if (state.selectedFoods[mealName]) {
                            alert('Ya existe una comida con ese nombre.');
                            return;
                        }
                        state.selectedFoods[mealName] = [];
                        // ACTUALIZA LA DIETA ACTUAL EN savedDiets
                        if (state.currentDietId) {
                            state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                        }
                        saveState();
                        renderMeals();
                    }
                };

                const calculateTotals = (foods) => {
                    return foods.reduce((acc, food) => ({
                        calories: acc.calories + (food.calories * food.quantity / 1000),
                        protein: acc.protein + (food.protein * food.quantity / 1000),
                        carbs: acc.carbs + (food.carbs * food.quantity / 1000),
                        fats: acc.fats + (food.fats * food.quantity / 1000),
                        cost: acc.cost + (food.price * food.quantity / 1000)
                    }), { calories: 0, protein: 0, carbs: 0, fats: 0, cost: 0 });
                };

                // ===== PUBLIC API =====
                return {
                    init,
                    toggleTheme: () => {
                        const newTheme = state.theme === 'light' ? 'dark' : 'light';
                        setTheme(newTheme);
                    },
                    showFoodModal,
                    goToCategories: () => {
                        state.currentCategoryInModal = null;
                        App.showFoodModal();
                    },
                    closeFoodModal,
                    showFoods,
                    toggleFoodSelection,
                    addSelectedFoods,
                    updateQuantity,
                    removeFood,
                    deleteMeal,
                    loadDiet,
                    loadDietByIndex,
                    deleteCurrentDiet,
                    prevDiet,
                    nextDiet,
                    showShoppingList,
                    exportPDF,
                    updateModalQuantity,
                    createNewDiet,
                    editDietName,
                    calculateMacros,
                    handleFoodSearch,
                    addMeal,
                    openRecipesModal,
                    closeRecipesModal,
                    renderRecipesList,
                    openRecipeDetail,
                    closeRecipeDetail,
                    addRecipeToMeal,
                    openRecipeEditor,
                    closeRecipeEditor,
                    addIngredientToRecipe,
                    removeIngredientFromRecipe,
                    saveRecipe,
                    deleteRecipe,
                    updateUserIntolerancias: setupUserIntoleranciasBtns,
                    showMealSuggestions,
                    addSuggestionToMeal,
                    addNewSuggestion,
                    hideMealSuggestions,
                    deleteSuggestion,
                    editSuggestion,
                    openFoodSelectorForSuggestion: () => {
                        // Abre el modal de alimentos y cuando el usuario elija uno, lo pone como sugerencia
                        App.showFoodModal();
                        // Sobrescribe el handler de selección temporalmente
                        const originalToggle = App.toggleFoodSelection;
                        App.toggleFoodSelection = (foodName, event) => {
                            const { meal, idx } = state._editingSuggestion;
                            const food = App.getAllFoods ? App.getAllFoods()[foodName] : getAllFoods()[foodName];
                            state.mealSuggestions[meal][idx] = { name: foodName, emoji: food?.emoji || "🍽️" };
                            App.saveMealSuggestions && App.saveMealSuggestions();
                            App.showMealSuggestions(meal);
                            // Limpia el handler y cierra el modal
                            App.toggleFoodSelection = originalToggle;
                            document.getElementById('foodModal').style.display = 'none';
                        };
                    },
                    saveMealSuggestions,
                    loadMealSuggestions,
                    openFoodEditor: (foodName = null) => {
                        editingFoodName = foodName;
                        document.getElementById('food-editor-title').textContent = foodName ? 'Editar alimento' : 'Nuevo alimento';
                        // Busca primero en customFoods, luego en foodDB
                        const f = foodName ? (customFoods[foodName] || foodDB[foodName]) : {};
                        document.getElementById('food-editor-name').value = foodName || '';
                        document.getElementById('food-editor-emoji').value = f?.emoji || '🍽️';
                        document.getElementById('food-editor-emoji-btn').textContent = f?.emoji || '🍽️';
                        document.getElementById('food-editor-category').value = f?.category || '';
                        document.getElementById('food-editor-calories').value = f?.calories || '';
                        document.getElementById('food-editor-protein').value = f?.protein || '';
                        document.getElementById('food-editor-carbs').value = f?.carbs || '';
                        document.getElementById('food-editor-fats').value = f?.fats || '';
                        document.getElementById('food-editor-price').value = f?.price || '';

                        // Cargar intolerancias si el alimento existe
                        const intolerancias = f?.intolerancias || [];
                        document.querySelectorAll('#food-editor-Intolerancias input[type="checkbox"]').forEach(cb => {
                            cb.checked = intolerancias.includes(cb.value);
                        });

                        document.getElementById('foodEditorModal').style.display = 'flex';
                    },
                    closeFoodEditor: () => {
                        document.getElementById('foodEditorModal').style.display = 'none';
                    },
                    saveFoodEditor: () => {
                        const name = document.getElementById('food-editor-name').value.trim();
                        if (!name) return alert('Pon un nombre');
                        // Recoge las intolerancias seleccionadas
                        const intolerancias = Array.from(document.querySelectorAll('#food-editor-Intolerancias input[type="checkbox"]:checked')).map(cb => cb.value);
                        const food = {
                            emoji: document.getElementById('food-editor-emoji').value || '🍽️',
                            category: document.getElementById('food-editor-category').value,
                            calories: Number(document.getElementById('food-editor-calories').value) || 0,
                            protein: Number(document.getElementById('food-editor-protein').value) || 0,
                            carbs: Number(document.getElementById('food-editor-carbs').value) || 0,
                            fats: Number(document.getElementById('food-editor-fats').value) || 0,
                            price: Number(document.getElementById('food-editor-price').value) || 0,
                            intolerancias // <--- ahora sí existe la variable
                        };
                        // Si el nombre cambió y estaba en customFoods, bórralo
                        if (editingFoodName && editingFoodName !== name && customFoods[editingFoodName]) {
                            delete customFoods[editingFoodName];
                        }
                        customFoods[name] = food;
                        localStorage.setItem('customFoods', JSON.stringify(customFoods));
                        // Actualiza comidas con el nuevo alimento
                        App.updateFoodInMeals(editingFoodName, name, food);
                        App.closeFoodEditor();
                        if (state.currentCategoryInModal) {
                            App.showFoods(state.currentCategoryInModal);
                        }
                    },
                    deleteCustomFood: (foodName) => {
                        if (confirm('¿Eliminar este alimento?')) {
                            // Si existe en customFoods, bórralo
                            if (customFoods[foodName]) {
                                delete customFoods[foodName];
                                localStorage.setItem('customFoods', JSON.stringify(customFoods));
                            } else {
                                // Si es de base, crea una marca en localStorage para ocultarlo
                                let deletedFoods = JSON.parse(localStorage.getItem('deletedFoods') || '[]');
                                if (!deletedFoods.includes(foodName)) {
                                    deletedFoods.push(foodName);
                                    localStorage.setItem('deletedFoods', JSON.stringify(deletedFoods));
                                }
                            }
                            App.showFoodModal();
                        }
                    },
                    openEmojiPicker: () => {
                        const picker = document.getElementById('emoji-picker');
                        const btn = document.getElementById('food-editor-emoji-btn');
                        // Si ya está visible, ocultar
                        if (picker.style.display === 'block') {
                            picker.style.display = 'none';
                            return;
                        }
                        // Rellenar solo una vez
                        if (!picker.innerHTML.trim()) {
                            const emojis = [
                                '🍗', '🥚', '🐟', '🦃', '🍖', '🧀', '🥛', '🌾', '🍚', '🍞', '🥦', '🥬', '🍅', '🥕', '🍠', '🍎', '🍌', '🥝', '🍓', '🥣', '🥑', '🫒', '🌰', '🌱', '💧', '🌿', '🍯', '🍲', '🍽️',
                                '🍆', '🍤', '🍔', '🍟', '🍕', '🥗', '🍳', '🥞', '🍘', '🍩', '🍛', '🍜', '🍝', '🥪', '🥙', '🥒', '🥔', '🍇', '🍉', '🍊', '🍋', '🍍', '🥭', '🍑', '🍒', '🥥', '🥜', '🥯', '🥨'
                            ];
                            picker.innerHTML = `<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;">${emojis.map(e =>
                                `<button style="font-size:1.3em;padding:6px 2px;border:none;background:none;cursor:pointer;border-radius:6px;" onclick="App.selectEmoji('${e}')" tabindex="0">${e}</button>`
                            ).join('')
                                }</div>`;
                        }
                        picker.style.display = 'block';
                        picker.style.minWidth = '320px';
                        picker.style.maxWidth = '420px';
                        setTimeout(() => {
                            document.addEventListener('mousedown', closeEmojiPickerOnClickOutside);
                        }, 0);
                        function closeEmojiPickerOnClickOutside(e) {
                            if (!picker.contains(e.target) && e.target !== btn) {
                                picker.style.display = 'none';
                                document.removeEventListener('mousedown', closeEmojiPickerOnClickOutside);
                            }
                        }
                    },
                    selectEmoji: (emoji) => {
                        document.getElementById('food-editor-emoji').value = emoji;
                        document.getElementById('food-editor-emoji-btn').textContent = emoji;
                        document.getElementById('emoji-picker').style.display = 'none';
                    },
                    updateFoodInMeals: (oldName, newName, newData) => {
                        Object.keys(state.selectedFoods).forEach(meal => {
                            state.selectedFoods[meal] = state.selectedFoods[meal].map(f => {
                                if (f.name === oldName) {
                                    return {
                                        ...f,
                                        name: newName,
                                        emoji: newData.emoji,
                                        category: newData.category,
                                        calories: newData.calories,
                                        protein: newData.protein,
                                        carbs: newData.carbs,
                                        fats: newData.fats,
                                        price: newData.price
                                    };
                                }
                                return f;
                            });
                        });
                        // Guarda cambios en la dieta actual
                        if (state.currentDietId) {
                            state.savedDiets[state.currentDietId] = JSON.parse(JSON.stringify(state.selectedFoods));
                        }
                        saveState();
                        renderMeals();
                        updateTotals();
                        generateShoppingList();
                    },
                };
            })();
            function syncUserIntoleranciasBtns() {
                // Obtiene el array actual de intolerancias del usuario
                const intolerancias = (window.state?.userIntolerancias) || JSON.parse(localStorage.getItem('userIntolerancias') || '[]');
                // Marca/desmarca todos los botones en todos los paneles
                document.querySelectorAll('.intolerancia-btn[data-value]').forEach(btn => {
                    if (intolerancias.includes(btn.dataset.value)) {
                        btn.classList.add('selected', 'active');
                    } else {
                        btn.classList.remove('selected', 'active');
                    }
                });
            }

            function setupUserIntoleranciasBtns() {
                document.querySelectorAll('.intolerancia-btn[data-value]').forEach(btn => {
                    btn.onclick = () => {
                        // Alterna el estado en el array global
                        let intolerancias = (window.state?.userIntolerancias) || JSON.parse(localStorage.getItem('userIntolerancias') || '[]');
                        const value = btn.dataset.value;
                        if (intolerancias.includes(value)) {
                            intolerancias = intolerancias.filter(i => i !== value);
                        } else {
                            intolerancias.push(value);
                        }
                        // Actualiza el estado global y localStorage
                        if (window.state) state.userIntolerancias = intolerancias;
                        localStorage.setItem('userIntolerancias', JSON.stringify(intolerancias));
                        // Sincroniza todos los botones en todos los paneles
                        syncUserIntoleranciasBtns();

                        // --- NUEVO: recarga el modal completo si está abierto ---
                        const modal = document.getElementById('foodModal');
                        if (modal && modal.style.display === 'flex') {
                            if (state.currentCategoryInModal) {
                                App.showFoods(state.currentCategoryInModal);
                            } else {
                                App.showFoodModal();
                            }
                        }
                    };
                });
                // Sincroniza visualmente al iniciar
                syncUserIntoleranciasBtns();
            }

            // Initialize the app when DOM is loaded
            document.addEventListener('DOMContentLoaded', () => {
                App.init();

                App.loadMealSuggestions && App.loadMealSuggestions();

                // Sincronizar scroll entre columnas
                const leftCol = document.querySelector('.container > div:not(.totals-section):not(aside)');
                const rightCol = document.querySelector('.totals-section');

                const syncScroll = (delta, targetCol) => {
                    targetCol.scrollTop += delta;
                };

                leftCol.addEventListener('wheel', e => {
                    const delta = e.deltaY;
                    if (delta > 0 && leftCol.scrollTop + leftCol.clientHeight >= leftCol.scrollHeight - 1) {
                        syncScroll(delta, rightCol);
                        e.preventDefault();
                    } else if (delta < 0 && leftCol.scrollTop <= 0 && rightCol.scrollTop > 0) {
                        syncScroll(delta, rightCol);
                        e.preventDefault();
                    }
                }, { passive: false });

                rightCol.addEventListener('wheel', e => {
                    const delta = e.deltaY;
                    // Scroll hacia abajo al final de la derecha → mueve la izquierda
                    if (delta > 0 && rightCol.scrollTop + rightCol.clientHeight >= rightCol.scrollHeight - 1) {
                        syncScroll(delta, leftCol);
                        e.preventDefault();
                    }
                    // Scroll hacia arriba al principio de la derecha → mueve la izquierda
                    else if (delta < 0 && rightCol.scrollTop <= 0 && leftCol.scrollTop > 0) {
                        syncScroll(delta, leftCol);
                        e.preventDefault();
                    }
                }, { passive: false });

                document.getElementById('open-recipes-btn').onclick = App.openRecipesModal;

                // Cerrar modales de recetas al hacer clic fuera del contenido
                ['recipesModal', 'recipeEditorModal', 'recipeDetailModal'].forEach(id => {
                    const modal = document.getElementById(id);
                    if (modal) {
                        modal.addEventListener('mousedown', e => {
                            if (e.target === modal) {
                                if (id === 'recipesModal') App.closeRecipesModal();
                                if (id === 'recipeEditorModal') App.closeRecipeEditor();
                                if (id === 'recipeDetailModal') App.closeRecipeDetail();
                            }
                        });
                    }
                });

                document.addEventListener('mousedown', function (e) {
                    const modal = document.getElementById('foodEditorModal');
                    if (!modal || modal.style.display === 'none') return;
                    if (e.target === modal) {
                        App.closeFoodEditor();
                    }
                });
            });

            document.addEventListener('DOMContentLoaded', function () {
                const select = document.getElementById('activity-custom-select');
                const selected = document.getElementById('selected-activity');
                const options = document.getElementById('activity-options');
                const hiddenInput = document.getElementById('activity');

                // Inicialmente vacío
                selected.innerHTML = '';
                selected.style.minHeight = '38px'; // Asegura el alto mínimo

                // Abrir/cerrar menú
                selected.onclick = function () {
                    const open = options.style.display === 'block' ? false : true;
                    options.style.display = open ? 'block' : 'none';
                    selected.classList.toggle('active', open);
                };

                // Cerrar si haces click fuera
                document.addEventListener('mousedown', function (e) {
                    if (!select.contains(e.target)) {
                        options.style.display = 'none';
                        selected.classList.remove('active');
                    }
                });

                // Selección de opción
                options.querySelectorAll('.option').forEach(opt => {
                    opt.onclick = function () {
                        // Crea el contenido de la opción seleccionada SIN el interrogante
                        selected.innerHTML = `
                        <span class="activity-emoji">${opt.querySelector('.activity-emoji').textContent}</span>
                        ${opt.dataset.value}
                    `;
                        hiddenInput.value = opt.dataset.value;
                        options.style.display = 'none';
                        // Actualiza el estado y guarda
                        if (window.state) state.userData.activity = opt.dataset.value;
                        if (typeof saveUserData === 'function') saveUserData();
                        if (window.App && typeof App.calculateMacros === 'function') App.calculateMacros();
                        if (window.App && typeof App.updateTotals === 'function') App.updateTotals();
                    };
                    // Tooltip en icono de info
                    const infoIcon = opt.querySelector('.activity-info-icon');
                    if (infoIcon) {
                        infoIcon.setAttribute('data-desc', opt.dataset.desc);
                        infoIcon.removeAttribute('title'); // Elimina el tooltip nativo
                        infoIcon.addEventListener('contextmenu', e => e.preventDefault());
                    }
                });

                // Desactiva menú contextual también en el seleccionado
                selected.addEventListener('contextmenu', e => e.preventDefault());

                // --- NUEVO: al cargar, muestra la opción guardada si existe ---
                const currentValue = hiddenInput.value || (window.state && state.userData.activity);
                if (currentValue) {
                    const opt = options.querySelector(`.option[data-value="${currentValue}"]`);
                    if (opt) {
                        selected.innerHTML = `
                            <span class="activity-emoji">${opt.querySelector('.activity-emoji').textContent}</span>
                            ${opt.dataset.value}
                        `;
                    }
                }
            });
window.App = App;