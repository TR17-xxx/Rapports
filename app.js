// Liste des ouvriers par défaut
const defaultWorkers = [
    { id: 1, firstName: "Yann", lastName: "Moinard" },
    { id: 2, firstName: "Nathan", lastName: "Domain" },
    { id: 3, firstName: "Pierre", lastName: "Canals" },
    { id: 4, firstName: "Morgan", lastName: "Robin" },
    { id: 5, firstName: "Stéphane", lastName: "Bolantin" },
    { id: 6, firstName: "Alexandre", lastName: "Heugues" },
    { id: 7, firstName: "Arnaud", lastName: "Fleury" },
    { id: 8, firstName: "Loïc", lastName: "Hérault" },
    { id: 9, firstName: "Olivier", lastName: "Simmonet" },
    { id: 10, firstName: "Romain", lastName: "Pedeneau" },
    { id: 11, firstName: "Noa", lastName: "Flosseau" },
    { id: 12, firstName: "Anthony", lastName: "Baudry" },
    { id: 13, firstName: "Jean-Claude", lastName: "Lamberton" },
];

// Liste des chantiers par défaut (par ordre alphabétique)
const defaultSites = [
    "Brouage",
    "Château d'Oléron",
    "Consac",
    "Cram Chaban",
    "Dépôt",
    "Forges",
    "Javrezac",
    "Puybautier"
];

// État de l'application
let state = {
    availableWorkers: [...defaultWorkers].sort((a, b) => a.lastName.localeCompare(b.lastName)), // Liste complète des ouvriers
    activeWorkers: [], // Ouvriers ajoutés au rapport
    nextWorkerId: 14,
    availableSites: [...defaultSites].sort(), // Liste complète des chantiers
    foremanId: null, // Chef de chantier
    weekNumber: null,
    weekStart: null,
    weekEnd: null,
    data: {}, // { workerId: { sites: [{ siteName, hours: { monday, tuesday, ... } }], observation: '', isInterim: true } }
    drivers: { // Qui conduit chaque jour (par défaut le chef de chantier)
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null
    },
    isPrevisionnel: false, // Mode prévisionnel activé/désactivé
    currentSiteSelection: null // Pour stocker le contexte de sélection de chantier
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeWeek();
    initializeWorkers();
    setupEventListeners();
    renderAll();
});

// Initialiser la semaine courante
function initializeWeek() {
    const today = new Date();
    const weekInput = document.getElementById('weekSelector');
    
    // Obtenir la semaine courante au format YYYY-Www
    const year = today.getFullYear();
    const weekNumber = getWeekNumber(today);
    weekInput.value = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    
    updateWeekDisplay();
}

// Obtenir le numéro de semaine ISO
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Mettre à jour l'affichage de la semaine
function updateWeekDisplay() {
    const weekInput = document.getElementById('weekSelector');
    const weekValue = weekInput.value;
    
    if (!weekValue) return;
    
    const [year, week] = weekValue.split('-W');
    state.weekNumber = weekValue;
    
    // Calculer le lundi et vendredi de la semaine
    const monday = getDateOfISOWeek(parseInt(week), parseInt(year));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    state.weekStart = monday;
    state.weekEnd = friday;
    
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const mondayStr = monday.toLocaleDateString('fr-FR', options);
    const fridayStr = friday.toLocaleDateString('fr-FR', options);
    
    document.getElementById('weekDisplay').textContent = `${mondayStr} au ${fridayStr}`;
    document.getElementById('printWeekDisplay').textContent = `${mondayStr} au ${fridayStr}`;
}

// Obtenir la date du lundi d'une semaine ISO
function getDateOfISOWeek(week, year) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

// Initialiser les ouvriers
function initializeWorkers() {
    // Ne rien faire par défaut, les ouvriers seront ajoutés manuellement
    updateForemanSelector();
}

// Créer un chantier vide avec heures pré-remplies à 7.5 (premier) ou 0 (suivants)
function createEmptySite(isFirstSite = true) {
    const defaultValue = isFirstSite ? 7.5 : 0;
    return {
        siteName: '',
        hours: {
            monday: defaultValue,
            tuesday: defaultValue,
            wednesday: defaultValue,
            thursday: defaultValue,
            friday: defaultValue
        }
    };
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    document.getElementById('weekSelector').addEventListener('change', updateWeekDisplay);
    document.getElementById('foremanSelector').addEventListener('change', function() {
        state.foremanId = parseInt(this.value) || null;
        // Ajouter automatiquement le chef de chantier aux ouvriers actifs
        if (state.foremanId) {
            addWorkerToActive(state.foremanId);
        }
        // Réinitialiser les conducteurs au chef de chantier
        resetDriversToForeman();
        updatePrintForeman();
        renderAll();
    });
    
    document.getElementById('addWorkerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addWorker();
    });
    
    // Mettre à jour la fiche d'impression avant d'imprimer
    window.addEventListener('beforeprint', function() {
        generatePrintSheet();
    });
}

// Mettre à jour le sélecteur de chef de chantier
function updateForemanSelector() {
    const select = document.getElementById('foremanSelector');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Sélectionner...</option>';
    
    state.availableWorkers.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = `${worker.lastName} ${worker.firstName}`;
        select.appendChild(option);
    });
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Réinitialiser les conducteurs au chef de chantier
function resetDriversToForeman() {
    if (state.foremanId) {
        state.drivers = {
            monday: state.foremanId,
            tuesday: state.foremanId,
            wednesday: state.foremanId,
            thursday: state.foremanId,
            friday: state.foremanId
        };
    }
}

// Mettre à jour l'affichage du chef de chantier pour l'impression
function updatePrintForeman() {
    const foremanDisplay = document.getElementById('printForemanDisplay');
    if (state.foremanId) {
        const foreman = state.availableWorkers.find(w => w.id === state.foremanId);
        if (foreman) {
            foremanDisplay.textContent = `${foreman.lastName} ${foreman.firstName}`;
        }
    } else {
        foremanDisplay.textContent = 'Non défini';
    }
}

// Mettre à jour le conducteur d'un jour
function updateDriver(day, workerId) {
    state.drivers[day] = parseInt(workerId) || state.foremanId;
    renderAll();
}

// Mettre à jour l'observation d'un ouvrier
function updateWorkerObservation(workerId, observation) {
    if (state.data[workerId]) {
        state.data[workerId].observation = observation;
    }
}

// Afficher le modal d'ajout d'ouvrier
function showAddWorkerModal() {
    updateWorkerSelectOptions();
    switchTab('existing'); // Par défaut sur l'onglet sélection
    document.getElementById('addWorkerModal').classList.remove('hidden');
    document.getElementById('workerSelect').focus();
    
    // Ajouter un gestionnaire pour la sélection automatique
    const workerSelect = document.getElementById('workerSelect');
    workerSelect.onchange = function() {
        if (this.value) {
            const workerId = parseInt(this.value);
            addWorkerToActive(workerId);
            hideAddWorkerModal();
        }
    };
}

// Changer d'onglet dans le modal
function switchTab(tab) {
    const tabExisting = document.getElementById('tabExisting');
    const tabNew = document.getElementById('tabNew');
    const existingSection = document.getElementById('existingWorkerSection');
    const newSection = document.getElementById('newWorkerSection');
    
    if (tab === 'existing') {
        // Activer l'onglet sélection
        tabExisting.classList.add('border-blue-600', 'text-blue-600');
        tabExisting.classList.remove('border-transparent', 'text-gray-500');
        tabNew.classList.remove('border-blue-600', 'text-blue-600');
        tabNew.classList.add('border-transparent', 'text-gray-500');
        
        existingSection.classList.remove('hidden');
        newSection.classList.add('hidden');
        
        // Vider les champs de création
        document.getElementById('newWorkerFirstName').value = '';
        document.getElementById('newWorkerLastName').value = '';
    } else {
        // Activer l'onglet création
        tabNew.classList.add('border-blue-600', 'text-blue-600');
        tabNew.classList.remove('border-transparent', 'text-gray-500');
        tabExisting.classList.remove('border-blue-600', 'text-blue-600');
        tabExisting.classList.add('border-transparent', 'text-gray-500');
        
        newSection.classList.remove('hidden');
        existingSection.classList.add('hidden');
        
        // Réinitialiser la sélection
        document.getElementById('workerSelect').value = '';
        
        // Focus sur le prénom
        setTimeout(() => document.getElementById('newWorkerFirstName').focus(), 100);
    }
}

// Mettre à jour les options du sélecteur d'ouvrier
function updateWorkerSelectOptions() {
    const select = document.getElementById('workerSelect');
    select.innerHTML = '<option value="">Choisir...</option>';
    
    // Filtrer les ouvriers qui ne sont pas déjà actifs
    const availableToAdd = state.availableWorkers.filter(w => 
        !state.activeWorkers.find(aw => aw.id === w.id)
    );
    
    availableToAdd.forEach(worker => {
        const option = document.createElement('option');
        option.value = worker.id;
        option.textContent = `${worker.lastName} ${worker.firstName}`;
        select.appendChild(option);
    });
}

// Masquer le modal d'ajout d'ouvrier
function hideAddWorkerModal() {
    document.getElementById('addWorkerModal').classList.add('hidden');
    document.getElementById('addWorkerForm').reset();
}

// Ajouter un ouvrier au rapport
function addWorker() {
    const existingSection = document.getElementById('existingWorkerSection');
    const isExistingTab = !existingSection.classList.contains('hidden');
    
    if (isExistingTab) {
        // Ajouter un ouvrier existant
        const workerId = parseInt(document.getElementById('workerSelect').value);
        
        if (!workerId) {
            alert('Veuillez sélectionner un ouvrier');
            return;
        }
        
        addWorkerToActive(workerId);
    } else {
        // Créer un nouvel ouvrier
        const firstName = document.getElementById('newWorkerFirstName').value.trim();
        const lastName = document.getElementById('newWorkerLastName').value.trim();
        
        if (!firstName || !lastName) {
            alert('Veuillez remplir le prénom et le nom');
            return;
        }
        
        // Créer le nouvel ouvrier
        const newWorker = {
            id: state.nextWorkerId++,
            firstName: firstName,
            lastName: lastName
        };
        
        // Ajouter à la liste disponible
        state.availableWorkers.push(newWorker);
        state.availableWorkers.sort((a, b) => a.lastName.localeCompare(b.lastName));
        
        // Mettre à jour le sélecteur de chef de chantier
        updateForemanSelector();
        
        // Ajouter directement au rapport
        addWorkerToActive(newWorker.id);
    }
    
    hideAddWorkerModal();
}

// Ajouter un ouvrier à la liste active
function addWorkerToActive(workerId) {
    const worker = state.availableWorkers.find(w => w.id === workerId);
    
    if (!worker) return;
    
    // Vérifier si l'ouvrier n'est pas déjà actif
    if (state.activeWorkers.find(w => w.id === workerId)) return;
    
    // Ajouter l'ouvrier aux actifs
    state.activeWorkers.push(worker);
    
    // Initialiser ses données
    if (!state.data[workerId]) {
        // Les ouvriers préenregistrés (id <= 13) ne sont pas intérimaires par défaut
        // Les nouveaux ouvriers créés (id >= 14) sont intérimaires par défaut
        const isPreregistered = workerId <= 13;
        state.data[workerId] = {
            sites: [createEmptySite()],
            observation: '',
            isInterim: !isPreregistered // true pour nouveaux, false pour préenregistrés
        };
    }
    
    // Trier les ouvriers actifs par nom de famille
    state.activeWorkers.sort((a, b) => a.lastName.localeCompare(b.lastName));
    
    renderAll();
}

// Retirer un ouvrier de la liste active
function removeWorkerFromActive(workerId) {
    const worker = state.availableWorkers.find(w => w.id === workerId);
    
    if (!worker) return;
    
    // Demander confirmation
    if (!confirm(`Retirer ${worker.lastName} ${worker.firstName} du rapport ?`)) {
        return;
    }
    
    // Retirer l'ouvrier des actifs
    state.activeWorkers = state.activeWorkers.filter(w => w.id !== workerId);
    
    // Si c'était le chef de chantier, le désélectionner
    if (state.foremanId === workerId) {
        state.foremanId = null;
        document.getElementById('foremanSelector').value = '';
    }
    
    // Retirer des conducteurs
    Object.keys(state.drivers).forEach(day => {
        if (state.drivers[day] === workerId) {
            state.drivers[day] = state.foremanId;
        }
    });
    
    renderAll();
}

// Ajouter un chantier à un ouvrier
function addSiteToWorker(workerId) {
    if (!state.data[workerId]) {
        state.data[workerId] = { sites: [], observation: '', isInterim: true };
    }
    // Le premier chantier a des valeurs à 7.5, les suivants à 0
    const isFirstSite = state.data[workerId].sites.length === 0;
    state.data[workerId].sites.push(createEmptySite(isFirstSite));
    renderWorkerCards();
    setTimeout(() => lucide.createIcons(), 0);
}

// Basculer l'affichage de l'observation d'un ouvrier
function toggleWorkerObservation(workerId) {
    const observationDiv = document.getElementById(`observation-${workerId}`);
    const button = document.getElementById(`observationBtn-${workerId}`);
    
    if (observationDiv.classList.contains('hidden')) {
        observationDiv.classList.remove('hidden');
        button.innerHTML = '<i data-lucide="eye-off" style="width: 20px; height: 20px;"></i><span>Masquer observation</span>';
    } else {
        observationDiv.classList.add('hidden');
        button.innerHTML = '<i data-lucide="message-square" style="width: 20px; height: 20px;"></i><span>Ajouter une observation</span>';
    }
    setTimeout(() => lucide.createIcons(), 0);
}

// Basculer le statut d'intérimaire d'un ouvrier
function toggleInterimStatus(workerId) {
    if (state.data[workerId]) {
        state.data[workerId].isInterim = !state.data[workerId].isInterim;
        renderWorkerCards();
        setTimeout(() => lucide.createIcons(), 0);
    }
}

// Afficher le modal de sélection de chantier
function showSelectSiteModal(workerId, siteIndex) {
    state.currentSiteSelection = { workerId, siteIndex };
    updateSiteSelectOptions();
    switchSiteTab('existing');
    document.getElementById('selectSiteModal').classList.remove('hidden');
    document.getElementById('siteSelect').focus();
    
    // Ajouter un gestionnaire pour la sélection automatique
    const siteSelect = document.getElementById('siteSelect');
    siteSelect.onchange = function() {
        if (this.value) {
            selectSite(this.value);
        }
    };
}

// Masquer le modal de sélection de chantier
function hideSelectSiteModal() {
    document.getElementById('selectSiteModal').classList.add('hidden');
    document.getElementById('selectSiteForm').reset();
    state.currentSiteSelection = null;
}

// Changer d'onglet dans le modal de chantier
function switchSiteTab(tab) {
    const tabExisting = document.getElementById('tabExistingSite');
    const tabNew = document.getElementById('tabNewSite');
    const existingSection = document.getElementById('existingSiteSection');
    const newSection = document.getElementById('newSiteSection');
    
    if (tab === 'existing') {
        tabExisting.classList.add('border-blue-600', 'text-blue-600');
        tabExisting.classList.remove('border-transparent', 'text-gray-500');
        tabNew.classList.remove('border-blue-600', 'text-blue-600');
        tabNew.classList.add('border-transparent', 'text-gray-500');
        
        existingSection.classList.remove('hidden');
        newSection.classList.add('hidden');
        
        document.getElementById('newSiteName').value = '';
    } else {
        tabNew.classList.add('border-blue-600', 'text-blue-600');
        tabNew.classList.remove('border-transparent', 'text-gray-500');
        tabExisting.classList.remove('border-blue-600', 'text-blue-600');
        tabExisting.classList.add('border-transparent', 'text-gray-500');
        
        newSection.classList.remove('hidden');
        existingSection.classList.add('hidden');
        
        document.getElementById('siteSelect').value = '';
        setTimeout(() => document.getElementById('newSiteName').focus(), 100);
    }
}

// Mettre à jour les options du sélecteur de chantier
function updateSiteSelectOptions() {
    const select = document.getElementById('siteSelect');
    select.innerHTML = '<option value="">Choisir...</option>';
    
    state.availableSites.forEach(siteName => {
        const option = document.createElement('option');
        option.value = siteName;
        option.textContent = siteName;
        select.appendChild(option);
    });
}

// Sélectionner un chantier
function selectSite(siteName) {
    if (!state.currentSiteSelection) return;
    
    const { workerId, siteIndex } = state.currentSiteSelection;
    updateSiteName(workerId, siteIndex, siteName);
    hideSelectSiteModal();
    renderWorkerCards();
    setTimeout(() => lucide.createIcons(), 0);
}

// Gérer la soumission du formulaire de chantier
document.addEventListener('DOMContentLoaded', function() {
    const selectSiteForm = document.getElementById('selectSiteForm');
    if (selectSiteForm) {
        selectSiteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const existingSection = document.getElementById('existingSiteSection');
            const isExistingTab = !existingSection.classList.contains('hidden');
            
            if (isExistingTab) {
                const siteName = document.getElementById('siteSelect').value;
                if (!siteName) {
                    alert('Veuillez sélectionner un chantier');
                    return;
                }
                selectSite(siteName);
            } else {
                const newSiteName = document.getElementById('newSiteName').value.trim();
                if (!newSiteName) {
                    alert('Veuillez entrer un nom de chantier');
                    return;
                }
                
                // Ajouter le nouveau chantier à la liste
                if (!state.availableSites.includes(newSiteName)) {
                    state.availableSites.push(newSiteName);
                    state.availableSites.sort();
                }
                
                selectSite(newSiteName);
            }
        });
    }
});

// Supprimer un chantier d'un ouvrier
function removeSiteFromWorker(workerId, siteIndex) {
    if (state.data[workerId] && state.data[workerId].sites.length > 1) {
        state.data[workerId].sites.splice(siteIndex, 1);
        renderAll();
    }
}

// Mettre à jour le nom d'un chantier
function updateSiteName(workerId, siteIndex, siteName) {
    if (state.data[workerId] && state.data[workerId].sites[siteIndex]) {
        state.data[workerId].sites[siteIndex].siteName = siteName;
        calculateAndRenderTotals();
    }
}

// Mettre à jour les heures
function updateHours(workerId, siteIndex, day, hours) {
    if (state.data[workerId] && state.data[workerId].sites[siteIndex]) {
        const newValue = parseFloat(hours) || 0;
        state.data[workerId].sites[siteIndex].hours[day] = newValue;
        
        // Si la valeur est > 7 sur un chantier autre que le premier, mettre le premier chantier à 0 pour ce jour
        if (newValue > 7 && siteIndex > 0 && state.data[workerId].sites.length > 1) {
            state.data[workerId].sites[0].hours[day] = 0;
            // Re-render pour afficher les changements
            renderWorkerCards();
            setTimeout(() => lucide.createIcons(), 0);
        }
        
        calculateAndRenderTotals();
    }
}

// Calculer le total d'un chantier
function calculateSiteTotal(site) {
    return Object.values(site.hours).reduce((sum, h) => sum + h, 0);
}

// Calculer le total d'un ouvrier
function calculateWorkerTotal(workerId) {
    if (!state.data[workerId]) return 0;
    return state.data[workerId].sites.reduce((sum, site) => sum + calculateSiteTotal(site), 0);
}

// Calculer le total général
function calculateGrandTotal() {
    return state.activeWorkers.reduce((sum, worker) => sum + calculateWorkerTotal(worker.id), 0);
}

// Calculer les totaux par chantier
function calculateSiteTotals() {
    const siteTotals = {};
    
    state.activeWorkers.forEach(worker => {
        if (state.data[worker.id]) {
            state.data[worker.id].sites.forEach(site => {
                if (site.siteName.trim()) {
                    if (!siteTotals[site.siteName]) {
                        siteTotals[site.siteName] = 0;
                    }
                    siteTotals[site.siteName] += calculateSiteTotal(site);
                }
            });
        }
    });
    
    return siteTotals;
}

// Rendre tout
function renderAll() {
    renderDriverSelection();
    renderWorkerCards();
    calculateAndRenderTotals();
}

// Rendre la ligne de sélection du conducteur
function renderDriverSelection() {
    const container = document.getElementById('driverSelectionRow');
    container.innerHTML = '';
    
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day, index) => {
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const currentDriver = state.drivers[day] || state.foremanId;
        
        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `
            <label class="block text-sm font-bold text-orange-800 mb-2">${dayNames[index]}</label>
            <select 
                onchange="updateDriver('${day}', this.value)"
                class="w-full px-4 py-2 border-2 border-orange-300 bg-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-gray-800 shadow-sm"
            >
                ${state.activeWorkers.map(w => {
                    const selected = currentDriver === w.id ? 'selected' : '';
                    return `<option value="${w.id}" ${selected}>${w.lastName} ${w.firstName}</option>`;
                }).join('')}
            </select>
        `;
        container.appendChild(dayDiv);
    });
}

// Rendre les cartes des ouvriers
function renderWorkerCards() {
    const container = document.getElementById('workersContainer');
    container.innerHTML = '';
    
    state.activeWorkers.forEach(worker => {
        const card = createWorkerCard(worker);
        container.appendChild(card);
    });
    
    setTimeout(() => lucide.createIcons(), 0);
}

// Créer une carte d'ouvrier
function createWorkerCard(worker) {
    const workerData = state.data[worker.id] || { sites: [createEmptySite()], observation: '', isInterim: true };
    const isForeman = state.foremanId === worker.id;
    const isInterim = workerData.isInterim !== false; // Par défaut true
    
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6';
    
    let html = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <span>${worker.lastName} ${worker.firstName}</span>
                ${isForeman ? '<span class="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded-full">Chef de chantier</span>' : ''}
                ${isInterim ? '<span class="ml-2 px-3 py-1 bg-orange-500 text-white text-sm rounded-full">Intérimaire</span>' : ''}
            </h3>
            <div class="flex items-center space-x-3">
                <div class="text-lg font-semibold text-blue-600">
                    Total: <span id="workerTotal-${worker.id}">${calculateWorkerTotal(worker.id).toFixed(1)}h</span>
                </div>
                <button 
                    onclick="removeWorkerFromActive(${worker.id})"
                    class="no-print p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Retirer cet ouvrier du rapport"
                >
                    <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
                </button>
            </div>
        </div>
    `;
    
    // Afficher chaque chantier
    workerData.sites.forEach((site, siteIndex) => {
        const siteTotal = calculateSiteTotal(site);
        
        html += `
            <div class="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 site-card">
                <div class="flex items-start justify-between site-header-wrapper">
                    <div class="site-name" style="flex: 1; padding-top: 20px;">
                        <button 
                            onclick="showSelectSiteModal(${worker.id}, ${siteIndex})"
                            class="w-full px-3 py-2 border-2 border-blue-300 bg-blue-50 rounded-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 font-semibold text-left text-blue-800 transition no-print"
                        >
                            ${site.siteName || '⚠️ Sélectionner un chantier'}
                        </button>
                        <div class="print:block hidden font-semibold text-gray-800">${site.siteName}</div>
                    </div>
                    ${workerData.sites.length > 1 ? `
                        <button 
                            onclick="removeSiteFromWorker(${worker.id}, ${siteIndex})"
                            class="ml-2 p-1 text-red-600 hover:bg-red-50 rounded-lg no-print site-delete-btn" style="margin-top: 20px;"
                            title="Supprimer ce chantier"
                        >
                            <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="flex-1 grid grid-cols-5 gap-1 site-days-grid">
                    ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, index) => {
                        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
                        return `
                            <div class="text-center">
                                <label class="block text-xs font-medium text-gray-600 mb-1">${dayNames[index]}</label>
                                <input 
                                    type="number" 
                                    value="${site.hours[day]}" 
                                    min="0" 
                                    max="24" 
                                    step="0.5"
                                    onchange="updateHours(${worker.id}, ${siteIndex}, '${day}', this.value)"
                                    class="w-full px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                >
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="no-print text-right text-sm font-semibold text-gray-700 mt-1">
                    Total chantier: ${siteTotal.toFixed(1)}h
                </div>
            </div>
        `;
    });
    
    html += `
        <div class="flex items-center justify-between mt-3 no-print">
            <div class="flex items-center space-x-3">
                <button 
                    onclick="addSiteToWorker(${worker.id})"
                    class="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <i data-lucide="plus-circle" style="width: 20px; height: 20px;"></i>
                    <span>Ajouter un chantier</span>
                </button>
                <button 
                    id="observationBtn-${worker.id}"
                    onclick="toggleWorkerObservation(${worker.id})"
                    class="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                    <i data-lucide="message-square" style="width: 20px; height: 20px;"></i>
                    <span>Ajouter une observation</span>
                </button>
            </div>
            <button 
                onclick="toggleInterimStatus(${worker.id})"
                class="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${isInterim ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}"
                title="${isInterim ? 'Marquer comme permanent' : 'Marquer comme intérimaire'}"
            >
                <i data-lucide="user-check" style="width: 20px; height: 20px;"></i>
                <span>Intérimaire</span>
            </button>
        </div>
        <div id="observation-${worker.id}" class="hidden mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">Observation pour ${worker.firstName} ${worker.lastName}</label>
            <textarea 
                onchange="updateWorkerObservation(${worker.id}, this.value)"
                rows="3" 
                placeholder="Ajouter une observation pour cet ouvrier..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-vertical"
            >${workerData.observation || ''}</textarea>
        </div>
    `;
    
    card.innerHTML = html;
    return card;
}

// Calculer et afficher les totaux
function calculateAndRenderTotals() {
    // Mettre à jour les totaux individuels des ouvriers
    state.activeWorkers.forEach(worker => {
        const totalElement = document.getElementById(`workerTotal-${worker.id}`);
        if (totalElement) {
            totalElement.textContent = `${calculateWorkerTotal(worker.id).toFixed(1)}h`;
        }
    });
    
    // Tableau des totaux par ouvrier
    const workerTotalTable = document.getElementById('workerTotalTable');
    workerTotalTable.innerHTML = '';
    
    state.activeWorkers.forEach(worker => {
        const total = calculateWorkerTotal(worker.id);
        if (total > 0) {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-3 text-left">${worker.lastName} ${worker.firstName}</td>
                <td class="px-4 py-3 text-right font-semibold">${total.toFixed(1)}h</td>
            `;
            workerTotalTable.appendChild(row);
        }
    });
    
    if (workerTotalTable.children.length === 0) {
        workerTotalTable.innerHTML = '<tr><td colspan="2" class="px-4 py-4 text-center text-gray-500">Aucune donnée</td></tr>';
    }
    
    // Tableau des totaux par chantier
    const siteTotalTable = document.getElementById('siteTotalTable');
    siteTotalTable.innerHTML = '';
    
    const siteTotals = calculateSiteTotals();
    const sortedSites = Object.entries(siteTotals).sort((a, b) => b[1] - a[1]);
    
    sortedSites.forEach(([siteName, total]) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 text-left">${siteName}</td>
            <td class="px-4 py-3 text-right font-semibold">${total.toFixed(1)}h</td>
        `;
        siteTotalTable.appendChild(row);
    });
    
    if (siteTotalTable.children.length === 0) {
        siteTotalTable.innerHTML = '<tr><td colspan="2" class="px-4 py-4 text-center text-gray-500">Aucune donnée</td></tr>';
    }
    
    // Total général
    const grandTotal = calculateGrandTotal();
    document.getElementById('grandTotal').textContent = `${grandTotal.toFixed(1)}h`;
    document.getElementById('grandTotalSites').textContent = `${grandTotal.toFixed(1)}h`;
}

// Fonction pour lancer l'impression (optimisée pour mobile)
function printReport() {
    try {
        // Vérifier qu'il y a des ouvriers actifs
        if (state.activeWorkers.length === 0) {
            alert('Veuillez ajouter au moins un ouvrier avant d\'imprimer.');
            return;
        }
        
        // Générer la fiche d'impression
        if (typeof generatePrintSheet === 'function') {
            generatePrintSheet();
        }
        
        if (typeof updateObservationsPrint === 'function') {
            updateObservationsPrint();
        }
        
        // Délai plus long pour mobile (300ms) pour s'assurer que le DOM est mis à jour
        setTimeout(function() {
            try {
                window.print();
            } catch (e) {
                console.error('Erreur lors de l\'impression:', e);
                alert('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez réessayer.');
            }
        }, 300);
    } catch (error) {
        console.error('Erreur dans printReport:', error);
        alert('Une erreur est survenue. Veuillez recharger la page et réessayer.');
    }
}

// Activer/Désactiver le mode prévisionnel
function togglePrevisionnel() {
    state.isPrevisionnel = !state.isPrevisionnel;
    const watermark = document.getElementById('previsionnelWatermark');
    const btn = document.getElementById('previsionnelBtn');
    
    if (state.isPrevisionnel) {
        watermark.classList.add('active');
        btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        btn.classList.add('bg-red-500', 'text-white', 'hover:bg-red-600');
    } else {
        watermark.classList.remove('active');
        btn.classList.remove('bg-red-500', 'text-white', 'hover:bg-red-600');
        btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
    }
}

// Générer la fiche de pointage pour l'impression
function generatePrintSheet() {
    const printSheet = document.getElementById('printSheet');
    if (!printSheet) return;
    
    // Récupérer les informations
    const weekDisplay = document.getElementById('weekDisplay').textContent;
    const foremanDisplay = document.getElementById('printForemanDisplay').textContent;
    const weekNumber = state.weekNumber ? state.weekNumber.split('-W')[1] : '';
    
    // Générer une fiche par ouvrier
    let html = '';
    
    state.activeWorkers.forEach((worker, workerIndex) => {
        if (workerIndex > 0) {
            html += '<div class="print-break"></div>';
        }
        
        const workerData = state.data[worker.id] || { sites: [], observation: '', isInterim: true };
        const workerTotal = calculateWorkerTotal(worker.id);
        const workerObservation = workerData.observation || '';
        const isInterim = workerData.isInterim !== false;
        
        html += `
        <div class="print-sheet">
            <!-- En-tête -->
            <div class="print-header">
                <div>
                    <div class="semaine">Semaine</div>
                    <div class="semaine">${weekNumber}</div>
                </div>
                <div>
                    <div class="title">FICHE DE POINTAGE HEBDOMADAIRE</div>
                    <div class="dates">${weekDisplay}</div>
                </div>
                <div>
                    <div class="nom-label">NOM:</div>
                    <div class="nom-value">${worker.lastName} ${worker.firstName}</div>
                </div>
            </div>
            
            <!-- Tableau principal -->
            <table class="print-table">
                <thead>
                    <tr>
                        <th class="chantier-col">CHANTIER</th>
                        <th class="day-col">LUNDI</th>
                        <th class="day-col">MARDI</th>
                        <th class="day-col">MERCREDI</th>
                        <th class="day-col">JEUDI</th>
                        <th class="day-col">VENDREDI</th>
                        <th class="day-col">SAMEDI</th>
                        <th class="total-col">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Ajouter les chantiers de l'ouvrier
        workerData.sites.forEach(site => {
            const siteTotal = calculateSiteTotal(site);
            const siteName = site.siteName || '';
            
            html += `
                    <tr>
                        <td class="chantier-col">${siteName}</td>
                        <td>${site.hours.monday || ''}</td>
                        <td>${site.hours.tuesday || ''}</td>
                        <td>${site.hours.wednesday || ''}</td>
                        <td>${site.hours.thursday || ''}</td>
                        <td>${site.hours.friday || ''}</td>
                        <td></td>
                        <td class="total-col">${siteTotal > 0 ? siteTotal.toFixed(1) : ''}</td>
                    </tr>
            `;
        });
        
        // Ajouter des lignes vides pour remplir
        const emptyRows = Math.max(0, 5 - workerData.sites.length);
        for (let i = 0; i < emptyRows; i++) {
            html += `
                    <tr class="empty-row">
                        <td class="chantier-col"></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="total-col"></td>
                    </tr>
            `;
        }
        
        // Ligne de total
        html += `
                    <tr class="total-row">
                        <td class="chantier-col"></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td style="text-align: right; padding-right: 8px;">Total</td>
                        <td class="total-col total-value">${workerTotal > 0 ? workerTotal.toFixed(1) : ''}</td>
                    </tr>
        `;
        
        // Calculer les valeurs pour PANIER, TRANSPORT, TRAJET
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        
        // Pour chaque jour, vérifier si l'ouvrier a travaillé
        const workedDays = days.map(day => {
            let totalHours = 0;
            workerData.sites.forEach(site => {
                totalHours += site.hours[day] || 0;
            });
            return totalHours > 0;
        });
        
        // Pour chaque jour, vérifier si l'ouvrier est conducteur
        const isDriverDays = days.map(day => state.drivers[day] === worker.id);
        
        // PANIER : 1 si l'ouvrier a travaillé ce jour
        const panierValues = workedDays.map(worked => worked ? '1' : '');
        const panierTotal = panierValues.filter(v => v === '1').length;
        
        // TRANSPORT : 1 si l'ouvrier est conducteur ce jour
        const transportValues = isDriverDays.map(isDriver => isDriver ? '1' : '');
        const transportTotal = transportValues.filter(v => v === '1').length;
        
        // TRAJET : 1 si l'ouvrier a travaillé ce jour (conducteur ou non)
        const trajetValues = workedDays.map(worked => worked ? '1' : '');
        const trajetTotal = trajetValues.filter(v => v === '1').length;
        
        // Ligne PANIER
        html += `
                    <tr>
                        <td class="section-header">PANIER</td>
                        <td>${panierValues[0]}</td>
                        <td>${panierValues[1]}</td>
                        <td>${panierValues[2]}</td>
                        <td>${panierValues[3]}</td>
                        <td>${panierValues[4]}</td>
                        <td></td>
                        <td class="total-col">${panierTotal > 0 ? panierTotal : ''}</td>
                    </tr>
        `;
        
        // Ligne TRANSPORT
        html += `
                    <tr>
                        <td class="section-header">TRANSPORT</td>
                        <td>${transportValues[0]}</td>
                        <td>${transportValues[1]}</td>
                        <td>${transportValues[2]}</td>
                        <td>${transportValues[3]}</td>
                        <td>${transportValues[4]}</td>
                        <td></td>
                        <td class="total-col">${transportTotal > 0 ? transportTotal : ''}</td>
                    </tr>
        `;
        
        // Ligne TRAJET
        html += `
                    <tr>
                        <td class="section-header">TRAJET</td>
                        <td>${trajetValues[0]}</td>
                        <td>${trajetValues[1]}</td>
                        <td>${trajetValues[2]}</td>
                        <td>${trajetValues[3]}</td>
                        <td>${trajetValues[4]}</td>
                        <td></td>
                        <td class="total-col">${trajetTotal > 0 ? trajetTotal : ''}</td>
                    </tr>
        `;
        
        html += `
                </tbody>
            </table>
            
            <!-- Observations -->
            <div class="print-observations">
                <div class="print-observations-title">
                    OBSERVATIONS:
                    ${isInterim ? '<span style="margin-left: 20px; color: #f97316; font-weight: bold;">INTÉRIMAIRE</span>' : ''}
                </div>
                <div class="print-observations-content">${workerObservation}</div>
            </div>
            
            <!-- Pied de page avec signatures -->
            <div class="print-footer">
                <div>
                    <div class="print-footer-label">Référence: Agenda chef d'équipe</div>
                </div>
                <div>
                    <div class="print-footer-label">Visa conducteur:</div>
                </div>
            </div>
        </div>
        `;
    });
    
    printSheet.innerHTML = html;
}
