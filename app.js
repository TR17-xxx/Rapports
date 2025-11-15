// Polyfills pour la compatibilité avec les anciens navigateurs
(function() {
    // Polyfill pour Array.prototype.find (IE11, Android 4.x)
    if (!Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this == null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;
            
            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }
    
    // Polyfill pour Array.prototype.forEach (IE8)
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            if (this == null) {
                throw new TypeError('Array.prototype.forEach called on null or undefined');
            }
            var T, k;
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
            if (arguments.length > 1) {
                T = thisArg;
            }
            k = 0;
            while (k < len) {
                var kValue;
                if (k in O) {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);
                }
                k++;
            }
        };
    }
    
    // Polyfill pour Object.values (IE, Android 4.x)
    if (!Object.values) {
        Object.values = function(obj) {
            var vals = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    vals.push(obj[key]);
                }
            }
            return vals;
        };
    }
    
    // Polyfill pour Object.entries (IE, Android 4.x)
    if (!Object.entries) {
        Object.entries = function(obj) {
            var ownProps = Object.keys(obj),
                i = ownProps.length,
                resArray = new Array(i);
            while (i--) {
                resArray[i] = [ownProps[i], obj[ownProps[i]]];
            }
            return resArray;
        };
    }
    
    // Polyfill pour String.prototype.trim (IE8)
    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
    }
    
    // Polyfill pour console (IE9)
    if (!window.console) {
        window.console = {
            log: function() {},
            error: function() {},
            warn: function() {},
            info: function() {}
        };
    }
})();

// Les données sensibles (ouvriers et chantiers) sont chargées depuis workers-data.js
// Ce fichier est ignoré par Git pour protéger les informations personnelles
// Voir workers-data.template.js pour un exemple de structure

// État de l'application
let state = {
    availableWorkers: [],
    activeWorkers: [],
    nextWorkerId: 16,
    availableSites: [],
    vehicleOptions: [], // Véhicules disponibles (chargés depuis un fichier protégé ou l'API)
    vehicleUsage: createEmptyVehicleUsage(), // Sélection véhicule + km par jour
    customWorkers: [], // Ouvriers ajoutés manuellement
    customSites: [], // Chantiers ajoutés manuellement
    foremanId: null, // Chef de chantier
    weekNumber: null,
    weekStart: null,
    weekEnd: null,
    data: {}, // { workerId: { sites: [{ siteName, hours: { monday, tuesday, ... } }], observation: '', isInterim: true, panierMode: 'panier', panierCustom: { monday, tuesday, ... }, dayMentions: { monday: '', tuesday: '', ... } } }
    drivers: { // Qui conduit chaque jour (par défaut le chef de chantier)
        monday: null,
        tuesday: null,
        wednesday: null,
        thursday: null,
        friday: null
    },
    isPrevisionnel: false, // Mode prévisionnel activé/désactivé
    currentSiteSelection: null, // Pour stocker le contexte de sélection de chantier
    currentDayMention: null, // Pour stocker le contexte de sélection de mention de jour
    dataLoaded: false, // Indicateur de chargement des données
    lastEmailSentAt: null, // Timestamp du dernier envoi de rapport
    isEditingMileage: false, // Protection contre les re-renders pendant la saisie du kilométrage
    weeklyData: {} // Données par semaine : { '2024-W46': { activeWorkers, data, drivers, foremanId, isPrevisionnel, vehicleUsage }, ... }
};

// Clé pour le localStorage
const STORAGE_KEY = 'rapport_hebdomadaire_state';
const STORAGE_EXPIRY_DAYS = 8;
const EMAIL_COOLDOWN_MS = 1 * 60 * 1000; // 1 minute

// Sauvegarder l'état dans le localStorage
function saveState() {
    try {
        // Sauvegarder les données de la semaine courante dans weeklyData
        if (state.weekNumber) {
            state.weeklyData[state.weekNumber] = {
                activeWorkers: state.activeWorkers,
                data: state.data,
                drivers: state.drivers,
                foremanId: state.foremanId,
                isPrevisionnel: state.isPrevisionnel,
                vehicleUsage: state.vehicleUsage
            };
        }
        
        const stateToSave = {
            nextWorkerId: state.nextWorkerId,
            customWorkers: state.customWorkers, // Ouvriers ajoutés manuellement
            customSites: state.customSites, // Chantiers ajoutés manuellement
            weekNumber: state.weekNumber,
            weekStart: state.weekStart ? state.weekStart.toISOString() : null,
            weekEnd: state.weekEnd ? state.weekEnd.toISOString() : null,
            weeklyData: state.weeklyData, // Toutes les données par semaine
            lastEmailSentAt: state.lastEmailSentAt ? new Date(state.lastEmailSentAt).toISOString() : null,
            savedAt: new Date().toISOString(),
            expiryDate: new Date(Date.now() + (STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        console.log('État sauvegardé avec succès pour la semaine', state.weekNumber);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}

// Charger l'état depuis le localStorage
function loadState() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            return false;
        }
        
        const parsedData = JSON.parse(savedData);
        
        // Vérifier l'expiration
        const expiryDate = new Date(parsedData.expiryDate);
        const now = new Date();
        
        if (now > expiryDate) {
            console.log('Les données sauvegardées ont expiré');
            clearState();
            return false;
        }
        
        // Restaurer l'état global (non lié à une semaine spécifique)
        if (parsedData.nextWorkerId !== undefined) {
            state.nextWorkerId = parsedData.nextWorkerId;
        }
        if (parsedData.customWorkers) {
            state.customWorkers = parsedData.customWorkers;
            // Ajouter les ouvriers personnalisés à la liste disponible
            parsedData.customWorkers.forEach(worker => {
                if (!state.availableWorkers.find(w => w.id === worker.id)) {
                    state.availableWorkers.push(worker);
                }
            });
            state.availableWorkers.sort((a, b) => a.lastName.localeCompare(b.lastName));
        }
        if (parsedData.customSites) {
            state.customSites = parsedData.customSites;
            // Ajouter les chantiers personnalisés à la liste disponible
            parsedData.customSites.forEach(site => {
                if (!state.availableSites.includes(site)) {
                    state.availableSites.push(site);
                }
            });
            state.availableSites.sort();
        }
        if (parsedData.weekNumber) {
            state.weekNumber = parsedData.weekNumber;
        }
        if (parsedData.weekStart) {
            state.weekStart = new Date(parsedData.weekStart);
        }
        if (parsedData.weekEnd) {
            state.weekEnd = new Date(parsedData.weekEnd);
        }
        if (parsedData.lastEmailSentAt) {
            state.lastEmailSentAt = new Date(parsedData.lastEmailSentAt).getTime();
        }
        
        // Charger toutes les données par semaine
        if (parsedData.weeklyData) {
            state.weeklyData = parsedData.weeklyData;
        }
        
        // Charger les données de la semaine courante si elle existe
        if (state.weekNumber && state.weeklyData[state.weekNumber]) {
            const weekData = state.weeklyData[state.weekNumber];
            state.activeWorkers = weekData.activeWorkers || [];
            state.data = weekData.data || {};
            state.drivers = weekData.drivers || { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null };
            state.foremanId = weekData.foremanId || null;
            state.isPrevisionnel = weekData.isPrevisionnel || false;
            state.vehicleUsage = weekData.vehicleUsage ? normalizeVehicleUsage(weekData.vehicleUsage) : createEmptyVehicleUsage();
            
            // S'assurer que dayMentions existe pour chaque ouvrier
            Object.keys(state.data).forEach(workerId => {
                if (!state.data[workerId].dayMentions) {
                    state.data[workerId].dayMentions = createEmptyDayMentions();
                }
            });
        }
        
        console.log('État restauré avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        return false;
    }
}

// Effacer les données sauvegardées
function clearState() {
    // Demander confirmation avant d'effacer
    if (!confirm('⚠️ Êtes-vous sûr de vouloir effacer toutes les données sauvegardées ?\n\nCette action est irréversible et supprimera :\n- Tous les ouvriers ajoutés\n- Toutes les heures saisies\n- Tous les chantiers\n- Toutes les observations\n- Le chef de chantier sélectionné\n- Les conducteurs\n- Le mode prévisionnel')) {
        return;
    }
    
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('Données sauvegardées effacées');
        
        // Retirer les ouvriers personnalisés de la liste disponible
        state.customWorkers.forEach(customWorker => {
            state.availableWorkers = state.availableWorkers.filter(w => w.id !== customWorker.id);
        });
        
        // Retirer les chantiers personnalisés de la liste disponible
        state.customSites.forEach(customSite => {
            state.availableSites = state.availableSites.filter(s => s !== customSite);
        });
        
        // Réinitialiser l'état
        state.activeWorkers = [];
        state.customWorkers = [];
        state.customSites = [];
        state.foremanId = null;
        state.weekNumber = null;
        state.weekStart = null;
        state.weekEnd = null;
        state.data = {};
        state.drivers = {
            monday: null,
            tuesday: null,
            wednesday: null,
            thursday: null,
            friday: null
        };
        state.isPrevisionnel = false;
        state.vehicleUsage = createEmptyVehicleUsage();
        state.lastEmailSentAt = null;
        
        // Réinitialiser l'interface
        initializeWeek();
        initializeWorkers();
        renderAll();
        updateForemanDisplay();
        
        // Réinitialiser le mode prévisionnel dans l'interface
        const watermark = document.getElementById('previsionnelWatermark');
        const btn = document.getElementById('previsionnelBtn');
        const icon = document.getElementById('previsionnelIcon');
        if (watermark) {
            watermark.classList.remove('active');
        }
        if (btn) {
            btn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
            btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        }
        if (icon) {
            icon.setAttribute('data-lucide', 'x');
            icon.style.color = '#dc2626'; // red-600
            lucide.createIcons();
        }
        
        alert('✅ Les données sauvegardées ont été effacées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'effacement:', error);
        alert('❌ Erreur lors de l\'effacement des données.');
    }
}

// Vider le cache du navigateur et rafraîchir la page
function clearCache() {
    if (!confirm('🔄 Vider le cache et rafraîchir la page ?\n\nCela va :\n- Vider le cache du navigateur\n- Recharger la page avec la dernière version\n- Conserver vos données sauvegardées\n\nRecommandé après chaque mise à jour de l\'application.')) {
        return;
    }
    
    try {
        // Vider le cache si l'API est disponible
        if ('caches' in window) {
            caches.keys().then(function(names) {
                for (let name of names) {
                    caches.delete(name);
                }
            });
        }
        
        // Forcer le rechargement sans cache
        // L'option true force le rechargement depuis le serveur
        window.location.reload(true);
    } catch (error) {
        console.error('Erreur lors du vidage du cache:', error);
        // Fallback : rechargement normal
        window.location.reload(true);
    }
}

// Fonction pour charger les données des ouvriers et chantiers
async function loadWorkersData() {
    // En local, utiliser workers-data.js si disponible (chargé via <script>)
    if (typeof defaultWorkers !== 'undefined' && typeof defaultSites !== 'undefined') {
        state.availableWorkers = [...defaultWorkers].sort((a, b) => a.lastName.localeCompare(b.lastName));
        state.availableSites = [...defaultSites].sort();
        state.dataLoaded = true;
        return true;
    }
    
    // Sinon, charger depuis l'API locale/serveur
    try {
        const token = window.ACCESS_TOKEN || 'rapport2024secure';
        
        // Détecter si on est en local ou en production
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '/api/workers-data'  // Serveur local Node.js
            : '/.netlify/functions/get-workers-data';  // Production Netlify
        
        const response = await fetch(apiUrl, {
            headers: {
                'X-Access-Token': token
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load workers data');
        }
        
        const data = await response.json();
        state.availableWorkers = [...data.workers].sort((a, b) => a.lastName.localeCompare(b.lastName));
        state.availableSites = [...data.sites].sort();
        state.dataLoaded = true;
        return true;
    } catch (error) {
        console.error('Error loading workers data:', error);
        alert('Erreur lors du chargement des données. Veuillez recharger la page.');
        return false;
    }
}

function initializeVehicleOptions(sourceList) {
    const vehiclesSource = Array.isArray(sourceList) && sourceList.length > 0
        ? sourceList
        : null;
    
    if (!vehiclesSource) {
        state.vehicleOptions = [];
        return false;
    }
    
    state.vehicleOptions = vehiclesSource.map((vehicle, index) => {
        const fallbackId = `vehicle-${index + 1}`;
        const normalizedPlate = vehicle.plate ? String(vehicle.plate).toUpperCase() : '';
        const id = vehicle.id !== undefined ? vehicle.id : (normalizedPlate ? normalizedPlate : fallbackId);
        const description = vehicle.description ? String(vehicle.description) : '';
        const label = vehicle.label
            ? String(vehicle.label)
            : (normalizedPlate && description ? `${normalizedPlate} - ${description}` : (normalizedPlate || description || `Véhicule ${index + 1}`));
        
        return {
            id,
            plate: normalizedPlate,
            description,
            label,
            raw: vehicle
        };
    });
    
    return true;
}

// Chargement asynchrone des véhicules
async function loadVehicleOptions() {
    if (typeof defaultVehicles !== 'undefined' && Array.isArray(defaultVehicles) && defaultVehicles.length > 0) {
        initializeVehicleOptions(defaultVehicles);
        console.log('Véhicules chargés depuis vehicles-data.js');
        renderAll();
        return;
    }
    
    if (typeof window !== 'undefined' && Array.isArray(window.customVehicles) && window.customVehicles.length > 0) {
        initializeVehicleOptions(window.customVehicles);
        console.log('Véhicules chargés depuis window.customVehicles');
        renderAll();
        return;
    }
    
    try {
        const response = await fetch('/.netlify/functions/get-vehicles', {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Réponse invalide du service véhicules');
        }
        
        const data = await response.json();
        if (data && Array.isArray(data.vehicles)) {
            const success = initializeVehicleOptions(data.vehicles);
            if (success) {
                console.log('Véhicules chargés depuis l\'API Netlify (get-vehicles).');
                renderAll();
                return;
            }
        }
        
        console.warn('Aucun véhicule disponible depuis l’API.');
    } catch (error) {
        console.error('Erreur lors du chargement des véhicules via l’API:', error);
    }
    
    initializeVehicleOptions([]);
    renderAll();
}

// Callback déclenché lorsque vehicles-data.js est chargé (en local uniquement)
if (typeof window !== 'undefined') {
    window.__onVehicleDataLoaded = function() {
        if (typeof defaultVehicles !== 'undefined' && Array.isArray(defaultVehicles)) {
            initializeVehicleOptions(defaultVehicles);
        } else if (Array.isArray(window.customVehicles)) {
            initializeVehicleOptions(window.customVehicles);
        }
        renderAll();
        generatePrintSheet();
    };
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    // Charger les données des ouvriers et chantiers
    await loadWorkersData();
    
    // Charger la liste des véhicules
    await loadVehicleOptions();
    
    // Charger l'état sauvegardé (si disponible et non expiré)
    const stateLoaded = loadState();
    
    // Initialiser la semaine (sauf si restaurée depuis la sauvegarde)
    if (!stateLoaded || !state.weekNumber) {
        initializeWeek();
    } else {
        // Restaurer la semaine depuis l'état sauvegardé
        const weekInput = document.getElementById('weekSelector');
        if (weekInput && state.weekNumber) {
            weekInput.value = state.weekNumber;
            updateWeekDisplay();
        }
    }
    
    initializeWorkers();
    setupEventListeners();
    renderAll();
    
    if (typeof window !== 'undefined') {
        let resizeTimer = null;
        window.addEventListener('resize', function() {
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
            resizeTimer = setTimeout(function() {
                renderDriverSelection();
            }, 150);
        });
    }
    
    // Restaurer l'affichage du chef de chantier si sauvegardé
    if (stateLoaded && state.foremanId) {
        // S'assurer que le chef de chantier est dans les ouvriers actifs
        const foremanInActive = state.activeWorkers.find(w => w.id === state.foremanId);
        if (!foremanInActive) {
            // Si le chef de chantier n'est pas dans les ouvriers actifs, l'ajouter
            const foreman = state.availableWorkers.find(w => w.id === state.foremanId);
            if (foreman) {
                state.activeWorkers.push(foreman);
                state.activeWorkers.sort((a, b) => a.lastName.localeCompare(b.lastName));
            }
        }
        updateForemanDisplay();
        resetDriversToForeman();
        renderDriverSelection();
        renderAll();
    }
    
    // Restaurer le mode prévisionnel si sauvegardé
    const watermark = document.getElementById('previsionnelWatermark');
    const btn = document.getElementById('previsionnelBtn');
    const icon = document.getElementById('previsionnelIcon');
    const typingText = document.querySelector('.typing-text');
    
    if (stateLoaded && state.isPrevisionnel) {
        if (watermark) {
            watermark.classList.add('active');
        }
        if (btn) {
            btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
            btn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
        }
        if (icon) {
            icon.setAttribute('data-lucide', 'check');
            icon.style.color = 'white';
            lucide.createIcons();
        }
    } else {
        // S'assurer que le bouton est en mode désactivé (gris) au démarrage
        if (btn) {
            btn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
            btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        }
        if (icon) {
            icon.setAttribute('data-lucide', 'x');
            icon.style.color = '#dc2626'; // red-600
            lucide.createIcons();
        }
    }
    
    // Finaliser l'animation de frappe du texte sous le logo
    if (typingText) {
        typingText.addEventListener('animationend', function(event) {
            if (event.animationName === 'typing') {
                typingText.classList.add('typing-finished');
            }
        });
    }
    
    // Prévenir le zoom sur iOS lors du focus sur les inputs
    preventIOSZoom();
    
    // Améliorer les performances sur mobile
    optimizeMobilePerformance();
    
    // Masquer l'écran de chargement avec animation de fondu
    hideLoadingScreen();
});

// Masquer l'écran de chargement avec animation de fondu
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainContent = document.getElementById('mainContent');
    
    if (loadingScreen && mainContent) {
        // Attendre 2,5 secondes avant de commencer la transition (logo visible)
        setTimeout(function() {
            // Ajouter la classe fade-out pour déclencher l'animation
            loadingScreen.classList.add('fade-out');
            
            // Après la fin de l'animation (1 seconde), masquer complètement et afficher le contenu
            setTimeout(function() {
                loadingScreen.classList.add('hidden');
                mainContent.style.display = 'block';
                mainContent.classList.remove('rapport-slide-in');
                void mainContent.offsetWidth;
                mainContent.classList.add('rapport-slide-in');
            }, 1000); // Durée de l'animation de fondu (1s)
        }, 2500); // Affichage du logo pendant 2,5 secondes
        // Total : 2,5s (affichage) + 1s (transition) = 3,5 secondes
    }
}

// Prévenir le zoom automatique sur iOS
function preventIOSZoom() {
    // Désactiver temporairement le zoom lors du focus
    var inputs = document.querySelectorAll('input, select, textarea');
    var viewportMeta = document.querySelector('meta[name="viewport"]');
    var originalContent = viewportMeta ? viewportMeta.getAttribute('content') : '';
    
    function disableZoom() {
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
    }
    
    function enableZoom() {
        if (viewportMeta && originalContent) {
            setTimeout(function() {
                viewportMeta.setAttribute('content', originalContent);
            }, 500);
        }
    }
    
    // Appliquer aux inputs existants
    inputs.forEach(function(input) {
        input.addEventListener('focus', disableZoom, false);
        input.addEventListener('blur', enableZoom, false);
    });
    
    // Observer les nouveaux inputs ajoutés dynamiquement
    if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        var newInputs = node.querySelectorAll ? node.querySelectorAll('input, select, textarea') : [];
                        newInputs.forEach(function(input) {
                            input.addEventListener('focus', disableZoom, false);
                            input.addEventListener('blur', enableZoom, false);
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Optimiser les performances sur mobile
function optimizeMobilePerformance() {
    // Utiliser passive listeners pour améliorer le scroll
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
        var supportsPassive = false;
        try {
            var opts = Object.defineProperty({}, 'passive', {
                get: function() {
                    supportsPassive = true;
                }
            });
            window.addEventListener('test', null, opts);
        } catch (e) {}
        
        // Appliquer passive aux événements de scroll et touch
        if (supportsPassive) {
            document.addEventListener('touchstart', function() {}, { passive: true });
            document.addEventListener('touchmove', function() {}, { passive: true });
        }
    }
    
    // Optimiser le rendu sur mobile
    if (typeof requestAnimationFrame !== 'undefined') {
        // Utiliser requestAnimationFrame pour les mises à jour visuelles
        window.requestAnimationFrame = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            function(callback) { setTimeout(callback, 16); };
    }
}

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
    const previousWeekNumber = state.weekNumber;
    
    if (previousWeekNumber && previousWeekNumber !== weekValue) {
        console.log(`Changement de semaine: ${previousWeekNumber} -> ${weekValue}`);
        
        // Sauvegarder les données de la semaine précédente
        if (previousWeekNumber) {
            state.weeklyData[previousWeekNumber] = {
                activeWorkers: state.activeWorkers,
                data: state.data,
                drivers: state.drivers,
                foremanId: state.foremanId,
                isPrevisionnel: state.isPrevisionnel,
                vehicleUsage: state.vehicleUsage
            };
        }
        
        // Charger les données de la nouvelle semaine si elles existent
        if (state.weeklyData[weekValue]) {
            const weekData = state.weeklyData[weekValue];
            state.activeWorkers = weekData.activeWorkers || [];
            state.data = weekData.data || {};
            state.drivers = weekData.drivers || { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null };
            state.foremanId = weekData.foremanId || null;
            state.isPrevisionnel = weekData.isPrevisionnel || false;
            state.vehicleUsage = weekData.vehicleUsage ? normalizeVehicleUsage(weekData.vehicleUsage) : createEmptyVehicleUsage();
            console.log('Données de la semaine', weekValue, 'chargées');
        } else {
            // Nouvelle semaine : réinitialiser les données
            state.activeWorkers = [];
            state.data = {};
            state.drivers = { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null };
            state.foremanId = null;
            state.isPrevisionnel = false;
            state.vehicleUsage = createEmptyVehicleUsage();
            console.log('Nouvelle semaine', weekValue, ': données réinitialisées');
        }
        
        // Re-render l'interface
        renderAll();
        updateForemanDisplay();
        updatePrevisionnelButton();
        setTimeout(() => lucide.createIcons(), 0);
    }
    
    // Mettre à jour le numéro de semaine
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
    
    // Sauvegarder l'état
    saveState();
}

// Mettre à jour l'affichage du bouton prévisionnel (sans basculer l'état)
function updatePrevisionnelButton() {
    const btn = document.getElementById('previsionnelBtn');
    const icon = document.getElementById('previsionnelIcon');
    const watermark = document.getElementById('previsionnelWatermark');
    
    // Mettre à jour le bouton selon l'état
    if (btn) {
        if (state.isPrevisionnel) {
            // Mode activé : vert avec coche
            btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
            btn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
        } else {
            // Mode désactivé : gris avec croix
            btn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
            btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        }
    }
    
    // Mettre à jour l'icône
    if (icon) {
        if (state.isPrevisionnel) {
            // Coche verte
            icon.setAttribute('data-lucide', 'check');
            icon.style.color = 'white';
        } else {
            // Croix rouge
            icon.setAttribute('data-lucide', 'x');
            icon.style.color = '#dc2626'; // red-600
        }
        // Recréer l'icône Lucide
        lucide.createIcons();
    }
    
    // Mettre à jour le filigrane
    if (watermark) {
        if (state.isPrevisionnel) {
            watermark.classList.add('active');
        } else {
            watermark.classList.remove('active');
        }
    }
}

// Ajouter un chantier à un ouvrier
function addSiteToWorker(workerId) {
    if (!state.data[workerId]) {
        state.data[workerId] = { sites: [], observation: '', isInterim: false, panierMode: 'panier', panierCustom: createEmptyPanierCustom(), dayMentions: createEmptyDayMentions() };
    }
    // Le premier chantier a des valeurs à 7.5, les suivants à 0
    const isFirstSite = state.data[workerId].sites.length === 0;
    state.data[workerId].sites.push(createEmptySite(isFirstSite));
    renderWorkerCards();
    setTimeout(() => lucide.createIcons(), 0);
    // Sauvegarder l'état
    saveState();
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
        // Sauvegarder l'état
        saveState();
    }
}

// Mettre à jour le mode panier d'un ouvrier
function updatePanierMode(workerId, mode) {
    if (state.data[workerId]) {
        state.data[workerId].panierMode = mode;
        renderWorkerCards();
        setTimeout(() => lucide.createIcons(), 0);
        // Sauvegarder l'état
        saveState();
    }
}

// Mettre à jour une valeur personnalisée du panier
function updatePanierCustom(workerId, day, value) {
    if (state.data[workerId]) {
        state.data[workerId].panierCustom[day] = value;
        // Sauvegarder l'état
        saveState();
    }
}

// Afficher le modal de sélection de chantier
function showSelectSiteModal(workerId, siteIndex) {
    state.currentSiteSelection = { workerId, siteIndex };
    updateSiteSelectOptions();
    switchSiteTab('existing');
    const modal = document.getElementById('selectSiteModal');
    modal.classList.remove('hidden');
    
    // Scroller la modale au centre de l'écran visible
    setTimeout(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 10);
    
    // Détecter si on est sur mobile pour éviter le focus automatique
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isMobile) {
        setTimeout(function() {
            document.getElementById('siteSelect').focus();
        }, 100);
    }
    
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
                    // Ajouter à la liste des chantiers personnalisés
                    if (!state.customSites.includes(newSiteName)) {
                        state.customSites.push(newSiteName);
                    }
                    // Sauvegarder l'état
                    saveState();
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
        // Sauvegarder l'état
        saveState();
    }
}

// Mettre à jour le nom d'un chantier
function updateSiteName(workerId, siteIndex, siteName) {
    if (state.data[workerId] && state.data[workerId].sites[siteIndex]) {
        state.data[workerId].sites[siteIndex].siteName = siteName;
        calculateAndRenderTotals();
        // Sauvegarder l'état
        saveState();
    }
}

// Mettre à jour les heures
function updateHours(workerId, siteIndex, day, hours) {
    if (state.data[workerId] && state.data[workerId].sites[siteIndex]) {
        const newValue = parseFloat(hours) || 0;
        state.data[workerId].sites[siteIndex].hours[day] = newValue;
        
        // Si des heures sont saisies, retirer la mention pour ce jour
        if (newValue > 0 && state.data[workerId].dayMentions) {
            state.data[workerId].dayMentions[day] = '';
        }
        
        // Si la valeur est > 7 sur un chantier autre que le premier, mettre le premier chantier à 0 pour ce jour
        if (newValue > 7 && siteIndex > 0 && state.data[workerId].sites.length > 1) {
            state.data[workerId].sites[0].hours[day] = 0;
            // Re-render pour afficher les changements
            renderWorkerCards();
            setTimeout(() => lucide.createIcons(), 0);
        }
        
        calculateAndRenderTotals();
        // Sauvegarder l'état
        saveState();
    }
}

// Fonction pour afficher le modal de sélection de mention
function showDayMentionModal(workerId, siteIndex, day) {
    state.currentDayMention = { workerId, siteIndex, day };
    const modal = document.getElementById('dayMentionModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Réinitialiser le champ personnalisé
        const customInput = document.getElementById('customDayMention');
        if (customInput) {
            customInput.value = '';
        }
    }
}

// Fonction pour mettre à jour une mention
function updateDayMention(workerId, siteIndex, day, mention) {
    if (!state.data[workerId]) {
        state.data[workerId] = { sites: [], observation: '', isInterim: true, panierMode: 'panier', panierCustom: createEmptyPanierCustom(), dayMentions: createEmptyDayMentions() };
    }
    if (!state.data[workerId].dayMentions) {
        state.data[workerId].dayMentions = createEmptyDayMentions();
    }
    
    state.data[workerId].dayMentions[day] = mention;
    
    // Si une mention est ajoutée, mettre les heures à 0 pour ce jour et ce chantier
    if (mention && state.data[workerId].sites[siteIndex]) {
        state.data[workerId].sites[siteIndex].hours[day] = 0;
    }
    
    renderAll();
    setTimeout(() => lucide.createIcons(), 0);
    saveState();
}

// Fonction pour retirer une mention
function clearDayMention(workerId, siteIndex, day) {
    if (state.data[workerId] && state.data[workerId].dayMentions) {
        state.data[workerId].dayMentions[day] = '';
        renderAll();
        setTimeout(() => lucide.createIcons(), 0);
        saveState();
    }
}

// Fonction pour sélectionner une mention prédéfinie
function selectDayMention(mention) {
    if (!mention || mention.trim() === '') {
        alert('Veuillez entrer une mention');
        return;
    }
    
    if (state.currentDayMention) {
        const { workerId, siteIndex, day } = state.currentDayMention;
        updateDayMention(workerId, siteIndex, day, mention.trim());
        hideDayMentionModal();
    }
}

// Fonction pour masquer le modal
function hideDayMentionModal() {
    const modal = document.getElementById('dayMentionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    state.currentDayMention = null;
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
    // Ne pas re-render si l'utilisateur est en train de saisir le kilométrage
    if (state.isEditingMileage) {
        return;
    }
    
    const container = document.getElementById('driverSelectionRow');
    container.innerHTML = '';
    
    const isMobileLayout = (typeof window !== 'undefined' && window.matchMedia)
        ? window.matchMedia('(max-width: 768px)').matches
        : (typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
    
    if (isMobileLayout) {
        container.style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))';
        container.style.columnGap = '12px';
    } else {
        container.style.gridTemplateColumns = '';
        container.style.columnGap = '';
    }
    
    const vehicleOptions = state.vehicleOptions || [];
    
    const weeklySelectedVehicleId = state.vehicleUsage && typeof state.vehicleUsage.selectedVehicleId !== 'undefined'
        ? state.vehicleUsage.selectedVehicleId
        : '';
    
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day, index) => {
        const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const currentDriver = state.drivers[day] || state.foremanId;
        ensureVehicleUsageDay(day);
        
        const dayDiv = document.createElement('div');
        
        if (isMobileLayout) {
            dayDiv.className = 'flex flex-col items-center justify-between rounded-xl border-2 border-orange-300 bg-white px-2 py-3 shadow-sm';
            dayDiv.style.height = '100%';
            dayDiv.style.display = 'flex';
            dayDiv.style.flexDirection = 'column';
            dayDiv.style.justifyContent = 'space-between';
            dayDiv.style.width = '100%';
            dayDiv.innerHTML = `
                <span class="text-sm font-semibold uppercase tracking-wide text-orange-800 mb-2">${dayNames[index]}</span>
                <select 
                    onchange="updateDriver('${day}', this.value)"
                    class="block w-full px-3 py-2 border-2 border-orange-300 bg-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base font-semibold text-gray-800 text-center transition"
                >
                    ${state.activeWorkers.map(w => {
                        const selected = currentDriver === w.id ? 'selected' : '';
                        return `<option value="${escapeHtml(w.id)}" ${selected}>${escapeHtml(w.lastName)} ${escapeHtml(w.firstName)}</option>`;
                    }).join('')}
                </select>
            `;
        } else {
            dayDiv.className = 'space-y-3 bg-white rounded-xl p-4 border border-orange-100 shadow-sm';
            dayDiv.innerHTML = `
                <div>
                    <label class="block text-sm font-bold text-orange-800 mb-2">${dayNames[index]}</label>
                    <select 
                        onchange="updateDriver('${day}', this.value)"
                        class="w-full px-4 py-2 border-2 border-orange-300 bg-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium text-gray-800 shadow-sm"
                    >
                        ${state.activeWorkers.map(w => {
                            const selected = currentDriver === w.id ? 'selected' : '';
                            return `<option value="${escapeHtml(w.id)}" ${selected}>${escapeHtml(w.lastName)} ${escapeHtml(w.firstName)}</option>`;
                        }).join('')}
                    </select>
                </div>
            `;
        }
        
        container.appendChild(dayDiv);
    });
    
    const weeklyMileageValue = (state.vehicleUsage && typeof state.vehicleUsage.totalMileage === 'string')
        ? state.vehicleUsage.totalMileage
        : '';
    
    // Obtenir le label du véhicule sélectionné
    const selectedVehicle = vehicleOptions.find(v => String(v.id) === String(weeklySelectedVehicleId));
    const selectedVehicleLabel = selectedVehicle
        ? (selectedVehicle.label 
            ? selectedVehicle.label 
            : `${selectedVehicle.plate ? selectedVehicle.plate.toUpperCase() : ''}${selectedVehicle.plate && selectedVehicle.description ? ' - ' : ''}${selectedVehicle.description || ''}`)
        : '';
    
    const weeklyVehicleSelect = vehicleOptions.length > 0
        ? `
            <button 
                type="button"
                onclick="showSelectVehicleModal()"
                class="${isMobileLayout
                    ? 'w-full px-3 py-2 border-2 border-orange-300 bg-white rounded-lg hover:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base font-semibold text-gray-800 transition text-left'
                    : 'w-full px-3 py-2 border border-orange-200 bg-white rounded-lg hover:bg-orange-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800 shadow-sm text-left'}"
            >
                <div class="flex items-center justify-between">
                    <span>${selectedVehicleLabel ? escapeHtml(selectedVehicleLabel) : 'Sélectionner un véhicule'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </button>
        `
        : `
            <div class="${isMobileLayout
                ? 'px-3 py-2 border-2 border-dashed border-orange-300 rounded-lg bg-white text-sm text-orange-700 text-center'
                : 'px-3 py-2 border-2 border-dashed border-orange-300 rounded-lg bg-white text-sm text-orange-700'}">
                Aucun véhicule configuré
            </div>
        `;
    
    const weeklyDiv = document.createElement('div');
    weeklyDiv.classList.add('col-span-5', 'w-full');
    weeklyDiv.style.gridColumn = 'span 5 / span 5';
    weeklyDiv.innerHTML = isMobileLayout
        ? `
            <div class="rounded-xl border-2 border-orange-300 bg-white px-4 py-5 shadow-md space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-orange-800 mb-2 uppercase tracking-wide">Véhicule utilisé</label>
                    ${weeklyVehicleSelect}
                </div>
                <div>
                    <label class="block text-sm font-semibold text-orange-800 mb-2 uppercase tracking-wide">Kilométrage véhicule (km)</label>
                    <input 
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Saisir le kilométrage total"
                        value="${escapeHtml(weeklyMileageValue)}"
                        onfocus="startEditingMileage()"
                        onchange="updateWeeklyMileage(this)"
                        class="w-full px-3 py-2 border-2 border-orange-300 bg-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base font-semibold text-gray-800 transition"
                    >
                    <p class="text-xs text-gray-600 mt-2">Ce kilométrage sera indiqué automatiquement dans l'observation du rapport du chef de chantier.</p>
                </div>
            </div>
        `
        : `
            <div class="bg-white rounded-xl p-4 border border-orange-100 shadow-sm space-y-4">
                <div>
                    <label class="block text-sm font-semibold text-orange-700 mb-2 uppercase tracking-wide">Véhicule utilisé</label>
                    ${weeklyVehicleSelect}
                </div>
                <div>
                    <label class="block text-sm font-semibold text-orange-700 mb-2 uppercase tracking-wide">Kilométrage véhicule (km)</label>
                    <input 
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Saisir le kilométrage total"
                        value="${escapeHtml(weeklyMileageValue)}"
                        onfocus="startEditingMileage()"
                        onchange="updateWeeklyMileage(this)"
                        class="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-800 shadow-sm"
                    >
                    <p class="text-xs text-gray-500 mt-2">Ce kilométrage sera indiqué automatiquement dans l'observation du rapport du chef de chantier.</p>
                </div>
            </div>
        `;
    container.appendChild(weeklyDiv);
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
    const workerData = state.data[worker.id] || { sites: [createEmptySite()], observation: '', isInterim: true, panierMode: 'panier', panierCustom: createEmptyPanierCustom(), dayMentions: createEmptyDayMentions() };
    const isForeman = state.foremanId === worker.id;
    const isInterim = workerData.isInterim !== false; // Par défaut true
    const panierMode = workerData.panierMode || 'panier';
    const panierCustom = workerData.panierCustom || createEmptyPanierCustom();
    
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
                        const hours = site.hours[day] || 0;
                        const dayMentions = workerData.dayMentions || createEmptyDayMentions();
                        const mention = dayMentions[day] || '';
                        const hasMention = mention !== '';
                        
                        return `
                            <div class="text-center">
                                <label class="block text-xs font-medium text-gray-600 mb-1">${dayNames[index]}</label>
                                ${hasMention ? `
                                    <div class="relative">
                                        <input 
                                            type="text" 
                                            value="${mention}" 
                                            onchange="updateDayMention(${worker.id}, ${siteIndex}, '${day}', this.value)"
                                            placeholder="Mention"
                                            class="w-full px-1 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-xs bg-purple-50"
                                        >
                                        <button 
                                            onclick="clearDayMention(${worker.id}, ${siteIndex}, '${day}')"
                                            class="absolute right-0 top-0 p-0.5 text-red-500 hover:text-red-700 no-print"
                                            title="Retirer la mention"
                                            style="font-size: 10px;"
                                        >
                                            <i data-lucide="x" style="width: 12px; height: 12px;"></i>
                                        </button>
                                    </div>
                                ` : `
                                    <div class="space-y-1">
                                        <input 
                                            type="number" 
                                            value="${hours}" 
                                            min="0" 
                                            max="24" 
                                            step="0.5"
                                            onchange="updateHours(${worker.id}, ${siteIndex}, '${day}', this.value)"
                                            class="w-full px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                        >
                                        <button 
                                            onclick="showDayMentionModal(${worker.id}, ${siteIndex}, '${day}')"
                                            class="w-full px-1 py-0.5 text-xs text-purple-600 hover:bg-purple-50 rounded no-print flex items-center justify-center"
                                            title="Ajouter une mention"
                                        >
                                            <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                                        </button>
                                    </div>
                                `}
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
    
    // Section Panier
    html += `
        <div class="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div class="flex items-center space-x-4 mb-2">
                <label class="block text-sm font-bold text-purple-800">Panier:</label>
                <select 
                    onchange="updatePanierMode(${worker.id}, this.value)"
                    class="px-3 py-2 border-2 border-purple-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-gray-800"
                >
                    <option value="panier" ${panierMode === 'panier' ? 'selected' : ''}>Panier</option>
                    <option value="grand_deplacement" ${panierMode === 'grand_deplacement' ? 'selected' : ''}>Grand déplacement</option>
                    <option value="personnaliser" ${panierMode === 'personnaliser' ? 'selected' : ''}>Personnaliser</option>
                </select>
            </div>
            ${panierMode === 'personnaliser' ? `
                <div class="grid grid-cols-5 gap-1 mt-2">
                    ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, index) => {
                        const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
                        return `
                            <div class="text-center">
                                <label class="block text-xs font-medium text-gray-600 mb-1">${dayNames[index]}</label>
                                <select 
                                    onchange="updatePanierCustom(${worker.id}, '${day}', this.value)"
                                    class="w-full px-1 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-sm"
                                >
                                    <option value="0" ${panierCustom[day] === '0' ? 'selected' : ''}>0</option>
                                    <option value="1" ${panierCustom[day] === '1' ? 'selected' : ''}>1</option>
                                    <option value="GD" ${panierCustom[day] === 'GD' ? 'selected' : ''}>GD</option>
                                </select>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
        </div>
    `;
    
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

// Fonction pour ouvrir l'aide
function openHelp() {
    window.open('aide.html', '_blank');
}

// Fonction pour télécharger directement le PDF
async function downloadPdfDirectly() {
    console.log('[DEBUG] downloadPdfDirectly() appelée');
    try {
        // Vérifier qu'il y a des ouvriers actifs
        if (state.activeWorkers.length === 0) {
            alert('Veuillez ajouter au moins un ouvrier avant de télécharger le PDF.');
            return;
        }
        
        // Vérifier qu'un chef de chantier est sélectionné
        if (!state.foremanId) {
            alert('⚠️ Veuillez sélectionner un chef de chantier.');
            return;
        }
        
        // Vérifier que jsPDF est chargé
        console.log('[DEBUG] window.jspdf:', window.jspdf);
        if (!window.jspdf || !window.jspdf.jsPDF) {
            console.error('[DEBUG] jsPDF non chargé!');
            alert('❌ Erreur: La bibliothèque PDF n\'est pas chargée. Veuillez recharger la page.');
            return;
        }
        console.log('[DEBUG] jsPDF chargé avec succès');
        
        // Afficher un indicateur de chargement (important pour mobile)
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'pdfLoadingIndicator';
        loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 20px 40px; border-radius: 10px; z-index: 10000; font-size: 16px; text-align: center;';
        loadingMessage.innerHTML = '📄 Génération du PDF...<br><small>Veuillez patienter</small>';
        document.body.appendChild(loadingMessage);
        
        // Petit délai pour afficher le message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Récupérer les informations
        const weekSelector = document.getElementById('weekSelector');
        const weekDisplay = document.getElementById('weekDisplay');
        const weekValue = weekSelector.value;
        
        let weekNumber = '';
        if (weekValue) {
            const [year, week] = weekValue.split('-W');
            weekNumber = `S${week}-${year}`;
        }
        
        const currentForeman = state.availableWorkers.find(w => w.id === state.foremanId);
        const foremanName = currentForeman ? `${currentForeman.lastName} ${currentForeman.firstName}` : 'Non défini';
        state.activeWorkers.forEach((worker, index) => {
            if (index > 0) {
                doc.addPage();
            }
            
            const workerData = state.data[worker.id];
            const isInterim = workerData.isInterim !== false;
            const observationText = getWorkerObservationWithMileage(worker);
            const dayMentions = workerData.dayMentions || createEmptyDayMentions();
            
            // En-tête - 3 colonnes
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('Semaine', 15, 15);
            doc.text(weekNumber || '', 15, 20);
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('FICHE DE POINTAGE HEBDOMADAIRE', 105, 15, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(weekDisplay.textContent || '', 105, 20, { align: 'center' });
            
            doc.setFontSize(9);
            doc.text('NOM:', 170, 15);
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`${worker.lastName} ${worker.firstName}` || '', 170, 20, { maxWidth: 35 });
            doc.setFont(undefined, 'normal');
            
            // Ajouter le filigrane PRÉVISIONNEL si activé
            if (state.isPrevisionnel) {
                doc.setFontSize(80);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 0, 0);
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.15 }));
                doc.text('PRÉVISIONNEL', 105, 150, { 
                    align: 'center', 
                    angle: 45,
                    baseline: 'middle'
                });
                doc.restoreGraphicsState();
                doc.setTextColor(0, 0, 0);
            }
            
            // Tableau des heures
            const tableData = [];
            
            // Ajouter les chantiers avec support des mentions de jour
            workerData.sites.forEach(site => {
                // Calculer le total en tenant compte des mentions de jour
                let total = 0;
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                days.forEach(day => {
                    // Si pas de mention, ajouter les heures au total
                    if (!dayMentions[day]) {
                        total += site.hours[day] || 0;
                    }
                });
                
                // Afficher les mentions de jour à la place des heures quand elles existent
                tableData.push([
                    site.siteName || '',
                    dayMentions.monday ? dayMentions.monday : (site.hours.monday ? site.hours.monday.toString() : ''),
                    dayMentions.tuesday ? dayMentions.tuesday : (site.hours.tuesday ? site.hours.tuesday.toString() : ''),
                    dayMentions.wednesday ? dayMentions.wednesday : (site.hours.wednesday ? site.hours.wednesday.toString() : ''),
                    dayMentions.thursday ? dayMentions.thursday : (site.hours.thursday ? site.hours.thursday.toString() : ''),
                    dayMentions.friday ? dayMentions.friday : (site.hours.friday ? site.hours.friday.toString() : ''),
                    '',
                    total > 0 ? total.toFixed(1) : ''
                ]);
            });
            
            // Lignes vides
            const emptyRows = Math.max(0, 5 - workerData.sites.length);
            for (let i = 0; i < emptyRows; i++) {
                tableData.push(['', '', '', '', '', '', '', '']);
            }
            
            // Calculer les totaux
            let mondayTotal = 0, tuesdayTotal = 0, wednesdayTotal = 0, thursdayTotal = 0, fridayTotal = 0;
            workerData.sites.forEach(site => {
                mondayTotal += site.hours.monday || 0;
                tuesdayTotal += site.hours.tuesday || 0;
                wednesdayTotal += site.hours.wednesday || 0;
                thursdayTotal += site.hours.thursday || 0;
                fridayTotal += site.hours.friday || 0;
            });
            const grandTotal = mondayTotal + tuesdayTotal + wednesdayTotal + thursdayTotal + fridayTotal;
            
            tableData.push(['', '', '', '', '', '', 'Total', grandTotal > 0 ? grandTotal.toFixed(1) : '']);
            
            // Calculs PANIER, TRANSPORT, TRAJET
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            const workedDays = days.map(day => {
                // Si une mention existe pour ce jour (Férié, Vacances, etc.), le jour n'est pas travaillé
                if (dayMentions[day]) {
                    return false;
                }
                // Sinon, vérifier si des heures sont saisies
                let totalHours = 0;
                workerData.sites.forEach(site => {
                    totalHours += site.hours[day] || 0;
                });
                return totalHours > 0;
            });
            
            const isDriverDays = days.map(day => state.drivers[day] === worker.id);
            
            // PANIER
            const panierMode = workerData.panierMode || 'panier';
            const panierCustom = workerData.panierCustom || {};
            let panierValues = [];
            
            if (panierMode === 'panier') {
                panierValues = workedDays.map(worked => worked ? '1' : '');
            } else if (panierMode === 'grand_deplacement') {
                panierValues = workedDays.map(worked => worked ? 'GD' : '');
            } else if (panierMode === 'personnaliser') {
                panierValues = days.map((day, index) => {
                    return workedDays[index] ? (panierCustom[day] || '') : '';
                });
            }
            const panierTotal = panierValues.filter(v => v !== '').length;
            
            // TRANSPORT : 1 si l'ouvrier est conducteur ET a travaillé ce jour
            const transportValues = days.map((day, index) => {
                return (isDriverDays[index] && workedDays[index]) ? '1' : '';
            });
            const transportTotal = transportValues.filter(v => v === '1').length;
            
            const trajetValues = workedDays.map(worked => worked ? '1' : '');
            const trajetTotal = trajetValues.filter(v => v === '1').length;
            
            tableData.push(['PANIER', panierValues[0] || '', panierValues[1] || '', panierValues[2] || '', panierValues[3] || '', panierValues[4] || '', '', panierTotal > 0 ? panierTotal.toString() : '']);
            tableData.push(['TRANSPORT', transportValues[0] || '', transportValues[1] || '', transportValues[2] || '', transportValues[3] || '', transportValues[4] || '', '', transportTotal > 0 ? transportTotal.toString() : '']);
            tableData.push(['TRAJET', trajetValues[0] || '', trajetValues[1] || '', trajetValues[2] || '', trajetValues[3] || '', trajetValues[4] || '', '', trajetTotal > 0 ? trajetTotal.toString() : '']);
            
            doc.autoTable({
                startY: 30,
                head: [['CHANTIER', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'TOTAL']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5, lineColor: [0, 0, 0] },
                bodyStyles: { lineWidth: 0.5, lineColor: [0, 0, 0] },
                columnStyles: {
                    0: { cellWidth: 44, halign: 'left', fontSize: 8, overflow: 'linebreak' },
                    1: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    2: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    3: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    4: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    5: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    6: { cellWidth: 19, halign: 'center', fontSize: 8 },
                    7: { cellWidth: 20, halign: 'center', fontSize: 9, fontStyle: 'bold' }
                },
                didParseCell: function(data) {
                    const rowData = tableData[data.row.index];
                    if (rowData && (rowData[0] === 'PANIER' || rowData[0] === 'TRANSPORT' || rowData[0] === 'TRAJET')) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                    if (rowData && rowData[6] === 'Total') {
                        data.cell.styles.fontStyle = 'bold';
                        if (data.column.index === 7) {
                            data.cell.styles.textColor = [255, 0, 0];
                        }
                    }
                }
            });
            
            // Observations
            const finalY = doc.lastAutoTable.finalY + 10;
            const boxX = 15;
            const boxY = finalY - 3;
            const boxWidth = 180;
            const boxHeight = 25;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(boxX, boxY, boxWidth, boxHeight);
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('OBSERVATIONS:', boxX + 2, finalY);
            
            if (isInterim) {
                doc.setTextColor(255, 140, 0);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('INTÉRIMAIRE', boxX + 50, finalY);
            }
            
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
            if (observationText) {
                doc.setFontSize(9);
                doc.setFont(undefined, 'italic');
                const lines = doc.splitTextToSize(observationText, boxWidth - 8);
                doc.text(lines, boxX + 4, finalY + 7);
            }
            
            // Pied de page
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Référence: Agenda chef d\'équipe', 15, 270);
            doc.text(`Chef de chantier: ${foremanName}`, 15, 275);
            doc.text('Visa conducteur:', 110, 270);
        });
        
        // Télécharger le PDF
        const fileName = `Rapport_${weekDisplay.textContent.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
        
        // Retirer l'indicateur de chargement
        const indicator = document.getElementById('pdfLoadingIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Message de succès (optionnel, peut être commenté si trop intrusif)
        // alert('✅ PDF téléchargé avec succès!');
        
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        
        // Retirer l'indicateur de chargement en cas d'erreur
        const indicator = document.getElementById('pdfLoadingIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        alert('❌ Erreur lors de la génération du PDF: ' + error.message);
    }
}

// Fonction pour lancer l'impression (optimisée pour toutes versions)
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
        } else {
            console.error('generatePrintSheet n\'est pas définie');
            alert('Erreur: impossible de générer la fiche d\'impression.');
            return;
        }
        
        if (typeof updateObservationsPrint === 'function') {
            updateObservationsPrint();
        }
        
        // Vérifier que le contenu a été généré
        var printSheet = document.getElementById('printSheet');
        if (!printSheet || !printSheet.innerHTML || printSheet.innerHTML.trim() === '') {
            console.error('Le contenu d\'impression est vide');
            alert('Erreur: le contenu d\'impression n\'a pas pu être généré. Veuillez réessayer.');
            return;
        }
        
        // Détecter si mobile (pour délai minimal)
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Délai minimal : 100ms pour desktop, 250ms pour mobile
        var delay = isMobile ? 250 : 100;
        
        // Temporairement rendre visible pour la génération
        printSheet.style.display = 'block';
        printSheet.style.visibility = 'visible';
        
        // Attendre que le DOM soit prêt puis lancer l'impression
        setTimeout(function() {
            try {
                // Lancer l'impression
                window.print();
            } catch (e) {
                console.error('Erreur lors de l\'impression:', e);
                alert('Impossible d\'ouvrir la fenêtre d\'impression.\n\nVeuillez utiliser Ctrl+P (ou Cmd+P sur Mac) pour imprimer.');
            } finally {
                // Remettre le printSheet hors écran après l'impression
                setTimeout(function() {
                    if (printSheet) {
                        printSheet.style.display = '';
                        printSheet.style.visibility = '';
                    }
                }, 500);
            }
        }, delay);
    } catch (error) {
        console.error('Erreur dans printReport:', error);
        alert('Une erreur est survenue. Veuillez réessayer.');
    }
}

// Activer/Désactiver le mode prévisionnel
function togglePrevisionnel() {
    const btn = document.getElementById('previsionnelBtn');
    const icon = document.getElementById('previsionnelIcon');
    const watermark = document.getElementById('previsionnelWatermark');
    
    // Basculer l'état
    state.isPrevisionnel = !state.isPrevisionnel;
    
    // Mettre à jour le bouton selon l'état
    if (btn) {
        if (state.isPrevisionnel) {
            // Mode activé : vert avec coche
            btn.classList.remove('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
            btn.classList.add('bg-green-600', 'text-white', 'hover:bg-green-700');
        } else {
            // Mode désactivé : gris avec croix
            btn.classList.remove('bg-green-600', 'text-white', 'hover:bg-green-700');
            btn.classList.add('bg-gray-300', 'text-gray-700', 'hover:bg-gray-400');
        }
    }
    
    // Mettre à jour l'icône
    if (icon) {
        if (state.isPrevisionnel) {
            // Coche verte
            icon.setAttribute('data-lucide', 'check');
            icon.style.color = 'white';
        } else {
            // Croix rouge
            icon.setAttribute('data-lucide', 'x');
            icon.style.color = '#dc2626'; // red-600
        }
        // Recréer l'icône Lucide
        lucide.createIcons();
    }
    
    // Mettre à jour le filigrane
    if (state.isPrevisionnel) {
        watermark.classList.add('active');
    } else {
        watermark.classList.remove('active');
    }
    
    // Sauvegarder l'état
    saveState();
}

// Générer la fiche de pointage pour l'impression
function generatePrintSheet() {
    const printSheet = document.getElementById('printSheet');
    if (!printSheet) return;
    
    // Mettre à jour le nom du chef de chantier avant la génération
    updatePrintForeman();
    
    // Récupérer les informations
    const weekDisplay = document.getElementById('weekDisplay').textContent;
    let foremanDisplay = 'Non défini';
    if (state.foremanId) {
        const foreman = state.availableWorkers.find(w => w.id === state.foremanId);
        if (foreman) {
            foremanDisplay = `${foreman.lastName} ${foreman.firstName}`;
        }
    }
    const weekNumber = state.weekNumber ? state.weekNumber.split('-W')[1] : '';
    
    // Générer une fiche par ouvrier
    let html = '';
    
    state.activeWorkers.forEach((worker, workerIndex) => {
        if (workerIndex > 0) {
            html += '<div class="print-break"></div>';
        }
        
        const workerData = state.data[worker.id] || { sites: [], observation: '', isInterim: true, dayMentions: createEmptyDayMentions() };
        const workerTotal = calculateWorkerTotal(worker.id);
        const workerObservation = getWorkerObservationWithMileage(worker);
        const isInterim = workerData.isInterim !== false;
        const dayMentions = workerData.dayMentions || createEmptyDayMentions();
        
        html += `
        <div class="print-sheet" style="position: relative;">
            ${state.isPrevisionnel ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: bold; color: rgba(255, 0, 0, 0.15); pointer-events: none; z-index: 1; white-space: nowrap; text-transform: uppercase; letter-spacing: 15px;">PRÉVISIONNEL</div>' : ''}
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
                        <td>${dayMentions.monday ? dayMentions.monday : (site.hours.monday || '')}</td>
                        <td>${dayMentions.tuesday ? dayMentions.tuesday : (site.hours.tuesday || '')}</td>
                        <td>${dayMentions.wednesday ? dayMentions.wednesday : (site.hours.wednesday || '')}</td>
                        <td>${dayMentions.thursday ? dayMentions.thursday : (site.hours.thursday || '')}</td>
                        <td>${dayMentions.friday ? dayMentions.friday : (site.hours.friday || '')}</td>
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
            // Si une mention existe pour ce jour (Férié, Vacances, etc.), le jour n'est pas travaillé
            if (dayMentions[day]) {
                return false;
            }
            // Sinon, vérifier si des heures sont saisies
            let totalHours = 0;
            workerData.sites.forEach(site => {
                totalHours += site.hours[day] || 0;
            });
            return totalHours > 0;
        });
        
        // Pour chaque jour, vérifier si l'ouvrier est conducteur
        const isDriverDays = days.map(day => state.drivers[day] === worker.id);
        
        // PANIER : selon le mode sélectionné
        const panierMode = workerData.panierMode || 'panier';
        const panierCustom = workerData.panierCustom || createEmptyPanierCustom();
        let panierValues = [];
        
        if (panierMode === 'panier') {
            // Mode Panier : 1 pour tous les jours travaillés
            panierValues = workedDays.map(worked => worked ? '1' : '');
        } else if (panierMode === 'grand_deplacement') {
            // Mode Grand déplacement : GD pour tous les jours travaillés
            panierValues = workedDays.map(worked => worked ? 'GD' : '');
        } else if (panierMode === 'personnaliser') {
            // Mode Personnaliser : utiliser les valeurs personnalisées
            panierValues = days.map((day, index) => {
                // Afficher la valeur personnalisée uniquement si l'ouvrier a travaillé ce jour
                return workedDays[index] ? (panierCustom[day] || '') : '';
            });
        }
        
        // Calculer le total du panier
        const panierTotal = panierValues.filter(v => v !== '').length;
        
        // TRANSPORT : 1 si l'ouvrier est conducteur ET a travaillé ce jour
        const transportValues = days.map((day, index) => {
            return (isDriverDays[index] && workedDays[index]) ? '1' : '';
        });
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
                    <div class="print-footer-label">Chef de chantier: ${foremanDisplay}</div>
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

// Afficher la modal de confirmation avant l'envoi
function showConfirmSendModal() {
    // Vérifier qu'un chef de chantier est sélectionné
    if (!state.foremanId) {
        alert('⚠️ Veuillez sélectionner un chef de chantier avant d\'envoyer le rapport.');
        return;
    }

    // Vérifier qu'il y a au moins un ouvrier
    if (state.activeWorkers.length === 0) {
        alert('⚠️ Veuillez ajouter au moins un ouvrier avant d\'envoyer le rapport.');
        return;
    }

    // Remplir les informations du récapitulatif
    const weekDisplay = document.getElementById('weekDisplay').textContent;
    document.getElementById('confirmWeekDisplay').textContent = weekDisplay;

    const foreman = state.availableWorkers.find(w => w.id === state.foremanId);
    if (foreman) {
        document.getElementById('confirmForemanDisplay').textContent = `${foreman.lastName} ${foreman.firstName}`;
    }

    // Liste des ouvriers
    const workersList = state.activeWorkers
        .map(w => `${w.lastName} ${w.firstName}`)
        .join(', ');
    document.getElementById('confirmWorkersList').textContent = workersList;

    // Nombre d'ouvriers
    document.getElementById('confirmWorkerCount').textContent = state.activeWorkers.length;

    // Calculer le total des heures
    let totalHours = 0;
    state.activeWorkers.forEach(worker => {
        const workerData = state.data[worker.id];
        if (workerData && workerData.sites) {
            workerData.sites.forEach(site => {
                totalHours += calculateSiteTotal(site);
            });
        }
    });
    document.getElementById('confirmTotalHours').textContent = totalHours.toFixed(1) + 'h';

    // Générer l'aperçu du rapport
    generatePrintSheet();
    const printSheet = document.getElementById('printSheet');
    const preview = document.getElementById('confirmPreview');
    preview.innerHTML = printSheet.innerHTML;

    // Afficher/masquer l'alerte prévisionnel
    const previsionnelAlert = document.getElementById('previsionnelAlert');
    if (previsionnelAlert) {
        if (state.isPrevisionnel) {
            previsionnelAlert.classList.remove('hidden');
        } else {
            previsionnelAlert.classList.add('hidden');
        }
        // Recréer les icônes Lucide
        lucide.createIcons();
    }

    // Afficher la modal
    const modal = document.getElementById('confirmSendModal');
    modal.classList.remove('hidden');
    
    // Scroller la modale au centre de l'écran visible
    setTimeout(() => {
        modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lucide.createIcons();
    }, 10);
}

// Masquer la modal de confirmation
function hideConfirmSendModal() {
    document.getElementById('confirmSendModal').classList.add('hidden');
}

// Confirmer et envoyer le rapport
async function confirmAndSendReport() {
    // Avertir l'utilisateur si le mode prévisionnel est activé
    if (state.isPrevisionnel) {
        const confirmSend = confirm('⚠️ ATTENTION : Le mode PRÉVISIONNEL est activé.\n\nLe rapport sera envoyé avec le filigrane "PRÉVISIONNEL".\n\nVoulez-vous continuer l\'envoi ?');
        if (!confirmSend) {
            return; // L'utilisateur a annulé
        }
    }
    
    hideConfirmSendModal();
    await sendReportByEmail();
}

// Fonction pour envoyer le rapport par email
async function sendReportByEmail(event) {
    try {
        // Vérifier qu'un chef de chantier est sélectionné
        if (!state.foremanId) {
            alert('⚠️ Veuillez sélectionner un chef de chantier avant d\'envoyer le rapport.');
            return;
        }

        // Récupérer les informations du chef de chantier
        const currentForeman = state.availableWorkers.find(w => w.id === state.foremanId);
        if (!currentForeman) {
            alert('⚠️ Chef de chantier introuvable.');
            return;
        }

        // Empêcher les envois trop rapprochés (5 minutes)
        const now = Date.now();
        if (state.lastEmailSentAt && (now - state.lastEmailSentAt) < EMAIL_COOLDOWN_MS) {
            const remainingMs = EMAIL_COOLDOWN_MS - (now - state.lastEmailSentAt);
            const remainingSecondsTotal = Math.ceil(remainingMs / 1000);
            const remainingMinutes = Math.floor(remainingSecondsTotal / 60);
            const remainingSeconds = remainingSecondsTotal % 60;
            const parts = [];
            if (remainingMinutes > 0) {
                parts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
            }
            if (remainingSeconds > 0) {
                parts.push(`${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}`);
            }
            const remainingText = parts.join(' et ');
            alert(`⏳ Merci de patienter encore ${remainingText || 'quelques instants'} avant d'envoyer un nouveau rapport.`);
            return;
        }

        // Vérifier qu'il y a au moins un ouvrier
        if (state.activeWorkers.length === 0) {
            alert('⚠️ Veuillez ajouter au moins un ouvrier avant d\'envoyer le rapport.');
            return;
        }

        // Afficher un message de chargement
        const button = event?.target?.closest('button');
        const originalContent = button?.innerHTML;
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i data-lucide="loader" class="animate-spin" style="width: 20px; height: 20px;"></i><span>Envoi en cours...</span>';
            lucide.createIcons();
        }

        // Préparer les informations de la semaine
        const weekSelector = document.getElementById('weekSelector');
        const weekDisplay = document.getElementById('weekDisplay');
        const weekValue = weekSelector.value;
        
        // Extraire le numéro de semaine
        let weekNumber = '';
        if (weekValue) {
            const [year, week] = weekValue.split('-W');
            weekNumber = `S${week}-${year}`;
        }

        const weekInfo = {
            period: weekDisplay.textContent,
            foreman: currentForeman.firstName + ' ' + currentForeman.lastName,
            weekNumber: weekNumber || 'Non définie'
        };

        // Préparer les données des ouvriers pour PDFKit
        const reportData = {
            workers: state.activeWorkers.map(worker => {
                const workerData = state.data[worker.id];

                // S'assurer que les mentions de jour existent
                const dayMentions = workerData.dayMentions || createEmptyDayMentions();
                
                // Préparer les informations de conducteur pour chaque jour
                const drivers = {
                    monday: state.drivers.monday === worker.id,
                    tuesday: state.drivers.tuesday === worker.id,
                    wednesday: state.drivers.wednesday === worker.id,
                    thursday: state.drivers.thursday === worker.id,
                    friday: state.drivers.friday === worker.id
                };
                
                console.log(`[CLIENT DEBUG] Worker: ${worker.lastName} ${worker.firstName}`);
                console.log(`[CLIENT DEBUG] state.drivers:`, state.drivers);
                console.log(`[CLIENT DEBUG] worker.id:`, worker.id);
                console.log(`[CLIENT DEBUG] drivers:`, drivers);
                
                return {
                    name: `${worker.lastName} ${worker.firstName}`,
                    sites: workerData.sites.map(site => ({
                        name: site.siteName || '',
                        hours: {
                            monday: site.hours.monday || 0,
                            tuesday: site.hours.tuesday || 0,
                            wednesday: site.hours.wednesday || 0,
                            thursday: site.hours.thursday || 0,
                            friday: site.hours.friday || 0
                        }
                    })),
                    observation: getWorkerObservationWithMileage(worker),
                    drivers: drivers,
                    panierMode: workerData.panierMode || 'panier',
                    panierCustom: workerData.panierCustom || {},
                    isInterim: workerData.isInterim !== false,
                    dayMentions: dayMentions
                };
            })
        };
        reportData.isPrevisionnel = state.isPrevisionnel;

        // Envoyer la requête au serveur Netlify
        // URL relative pour fonctionner sur tous les déploiements
        const response = await fetch('/.netlify/functions/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Token': window.ACCESS_TOKEN || ''
            },
            body: JSON.stringify({
                reportData: reportData,
                weekInfo: weekInfo
            })
        });

        const result = await response.json();

        // Restaurer le bouton
        if (button) {
            button.disabled = false;
            button.innerHTML = originalContent;
            lucide.createIcons();
        }

        if (result.success) {
            state.lastEmailSentAt = Date.now();
            saveState();

            // Proposer le téléchargement du PDF
            const downloadPdf = confirm(`✅ Rapport envoyé avec succès!\n\nLe rapport a été envoyé aux destinataires configurés.\n\nSouhaitez-vous télécharger le PDF maintenant ?`);
            
            console.log('[DEBUG] downloadPdf:', downloadPdf);
            
            if (downloadPdf) {
                console.log('[DEBUG] Appel de downloadPdfDirectly()');
                // Déclencher le téléchargement direct du PDF
                try {
                    await downloadPdfDirectly();
                } catch (error) {
                    console.error('[DEBUG] Erreur dans downloadPdfDirectly:', error);
                }
            }
        } else {
            alert(`❌ Erreur lors de l'envoi: ${result.message}`);
        }

    } catch (error) {
        console.error('Erreur:', error);
        
        // Restaurer le bouton en cas d'erreur
        const button = event.target.closest('button');
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i data-lucide="mail" style="width: 20px; height: 20px;"></i><span>Envoyer par Email</span>';
            lucide.createIcons();
        }
        
        if (error.message.includes('Failed to fetch')) {
            alert('❌ Impossible de se connecter au serveur.\n\nVérifiez votre connexion internet ou que l\'application est correctement déployée sur Netlify.');
        } else {
            alert(`❌ Erreur lors de l'envoi du rapport: ${error.message}`);
        }
    }
}
