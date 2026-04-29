	// Desactivar el scroll automático del navegador para la SPA
	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}

	// =========================================
	// FUNCIÓN BARREDORA: LIMPIEZA DE FORMULARIOS
	// =========================================
	function limpiarFormularios() {
		const formularios = document.querySelectorAll('form');
		formularios.forEach(form => {
			form.reset();
		});

		// Sincronizar el hint inmediatamente después del reset,
		// sin animación para evitar desfase visual
		const hintSimple   = document.getElementById('db-hint-text');
		const hintAvanzada = document.getElementById('db-hint-text-avanzada');
		const textoDefault = 'Contiene libros, documentos, monograf\xedas, art\xedculos, tesis, etc. Tambi\xe9n contiene normas sin acceso al documento';

		if (hintSimple)   hintSimple.innerHTML   = textoDefault;
		if (hintAvanzada) hintAvanzada.innerHTML = textoDefault;

		if (typeof toggleTipoDocumento === 'function') {
			toggleTipoDocumento('inti');
		}
	}

	// SEGURIDAD: Función para escapar texto antes de insertarlo en HTML.
	// Convierte caracteres peligrosos en entidades HTML inofensivas.
	function escaparHTML(str) {
		if (typeof str !== 'string') return '';
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;');
	}

	// ---------------------------------------------
	// 1. RENDERIZADO DE NOTICIAS
	// ---------------------------------------------
	function renderNews() {
		fetch('noticias.json')
			.then(r => {
				if (!r.ok) throw new Error('Error al cargar noticias.json: ' + r.status);
				return r.json();
			})
			.then(dbNovedades => {
				if (!Array.isArray(dbNovedades)) {
					throw new Error('Formato inválido en noticias.json');
				}
				const sortedNews = dbNovedades.sort((a, b) => b.anio - a.anio);
				const container = document.getElementById('news-feed');
				if (!container) return;
				
				let html = '';
				let currentYear = null; 
				const latestYear = sortedNews.length > 0 ? sortedNews[0].anio : null;

				// DIBUJA LA SECCIÓN COMPLETA DE NOTICIAS (ACORDEONES)
				sortedNews.forEach(news => {
					if (news.anio !== currentYear) {
						if (currentYear !== null) {
							html += '</div></div>'; 
						}
						currentYear = news.anio;
						const isOpen = (currentYear === latestYear) ? 'open' : '';
						const icon = 'fa-chevron-right'; // Usamos siempre la misma flecha base
						html += `
						<div class="news-year-group ${isOpen}" onclick="toggleYearGroup(this)">
							<div class="news-year-separator">
								<span>${currentYear}</span>
								<i class="fas ${icon} year-toggle-icon"></i>
							</div>
							<div class="news-group-content">`;
					}
					html += `
						<div class="news-item">
							<div class="news-date"><span class="day">${escaparHTML(String(news.dia))}</span><span class="month">${escaparHTML(String(news.mes))}</span></div>
							<div><h4>${escaparHTML(news.titulo)}</h4><p>${news.texto}</p></div>
						</div>`;
				});

				if (currentYear !== null) {
					html += '</div></div>';
				}

				container.innerHTML = html;

				// DIBUJA LA TARJETA RESUMEN EN EL HOME
				const homeContainer = document.getElementById('latest-news-content');
				if(homeContainer && sortedNews.length > 0) {
					const latest = sortedNews[0];
					
					// 1. Le sacamos las etiquetas HTML (por si tiene <img> o <a>)
					let textoLimpio = latest.texto.replace(/<[^>]*>?/gm, '');
					
					// 2. Cortamos a 130 caracteres y agregamos "..." si es más largo
					let resumen = textoLimpio.length > 130 ? textoLimpio.substring(0, 130) + '...' : textoLimpio;

					homeContainer.innerHTML = `
					<div class="home-news-card">
						<div class="news-date"><span class="day">${escaparHTML(String(latest.dia))}</span><span class="month">${escaparHTML(String(latest.mes))}</span></div>
						<div>
							<h4>${escaparHTML(latest.titulo)}</h4>
							<p>${escaparHTML(resumen)}</p>
						</div>
					</div>`;
				}
			})
			.catch(err => console.error('Error cargando noticias:', err));
	}


	// =========================================
	// 2. FUNCIONALIDAD SCROLL TO TOP
	// =========================================
	const SCROLL_THRESHOLD_SHOW = 300;

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function toggleScrollButton() {
		const btn = document.getElementById("scrollToTopBtn");
		const scrollTop = document.body.scrollTop || document.documentElement.scrollTop;

		if (scrollTop > SCROLL_THRESHOLD_SHOW) {
			btn.style.opacity = '1';
			btn.style.pointerEvents = 'auto';
			btn.style.visibility = 'visible';
		} else {
			const opacityValue = Math.min(1.0, scrollTop / SCROLL_THRESHOLD_SHOW);
			btn.style.opacity = opacityValue.toString();
			btn.style.pointerEvents = 'none';
			btn.style.visibility = 'hidden';
		}
	}

	window.onscroll = toggleScrollButton;


	// LÓGICA DEL BOTÓN FLOTANTE DENTRO DEL MODAL
	(function() {
		// 1. Buscamos específicamente el contenedor que tiene el scroll en el modal abierto
		const modal = document.getElementById('results-modal');
		// Este es el elemento que realmente tiene el scroll ahora:
		const scrollContainer = modal.querySelector('.iframe-container'); 
		const btnModal = document.getElementById('modalScrollFab');
		let apuntaAbajo = true;
		let timeoutFantasma; // Variable global para nuestro reloj de arena fantasma

		if (!scrollContainer || !btnModal) return;

		// Capturamos el ícono de FontAwesome adentro del botón
		const icono = btnModal.querySelector('i');

		// 2. Escuchamos SOLO el scroll de esa caja interna
		scrollContainer.addEventListener('scroll', function() {
			const scrolled = scrollContainer.scrollTop; // Scroll actual
			const total = scrollContainer.scrollHeight - scrollContainer.clientHeight; // Scroll máximo posible
			const porcentaje = total > 0 ? scrolled / total : 0;

			// Limpiamos el temporizador cada vez que el usuario mueve el scroll
			clearTimeout(timeoutFantasma);

			// Umbral de aparición original de ISIS (scrolled > 200)
			if (scrolled > 200) {
				btnModal.classList.add('visible');
				
				// Iniciamos la cuenta regresiva de 2 segundos (2000 ms) para ocultarlo
				timeoutFantasma = setTimeout(function() {
					btnModal.classList.remove('visible');
				}, 2000);
			} else {
				btnModal.classList.remove('visible');
			}

			// Lógica de rotación: Si superó el 85%, rotamos SOLO EL ÍCONO con JS
			if (porcentaje > 0.85) {
				btnModal.title = "Volver arriba";
				// El chevron-down girará suavemente para apuntar arriba
				if (icono) icono.style.transform = "rotate(180deg)"; 
				apuntaAbajo = false;
			} else {
				btnModal.title = "Ir al final";
				// Devolver el ícono a su posición original
				if (icono) icono.style.transform = "rotate(0deg)"; 
				apuntaAbajo = true;
			}
		});

		// 3. Acción del clic
		btnModal.addEventListener('click', function() {
			if (apuntaAbajo) {
				// Mandamos el scrollContainer hasta el fondo
				scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
			} else {
				// Mandamos el scrollContainer hasta el techo
				scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
			}
		});

		// 4. Fallback táctil
		btnModal.addEventListener("touchstart", function(e) {
			// Pausamos el fantasma si el usuario toca el botón pero no suelta
			clearTimeout(timeoutFantasma); 
			e.preventDefault(); // Evita el clic fantasma
			if (apuntaAbajo) {
				scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
			} else {
				scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
			}
		});

		// 5. Mantenemos el botón vivo si el usuario le pasa el mouse por encima
		btnModal.addEventListener('mouseenter', function() {
			clearTimeout(timeoutFantasma);
		});
		
		// Si el usuario saca el mouse sin hacer clic, vuelve a empezar la cuenta regresiva
		btnModal.addEventListener('mouseleave', function() {
			if (scrollContainer.scrollTop > 200) {
				timeoutFantasma = setTimeout(function() {
					btnModal.classList.remove('visible');
				}, 2000);
			}
		});
	})();

	// =========================================
	// 3. FUNCIONALIDAD DE ACORDEÓN DE NOTICIAS
	// =========================================
	function toggleYearGroup(groupElement) {
		if (groupElement.classList.contains('news-year-group')) {
			groupElement.classList.toggle('open');
			// ¡Listo! Ya no cambiamos la clase del ícono con JS, 
			// dejamos que el CSS lo rote suavemente.
		}
	}

	// =========================================
	// 4. FUNCIÓN PARA CAMBIAR PESTAÑAS (CON FOOTER FLUIDO)
	// =========================================
	function openTab(event, tabId) {
		if (event) event.preventDefault();
		
		const wrapper = document.querySelector('.catalog-wrapper');
		
		// 1. Congelamos la altura actual y evitamos que el contenido se desborde feo
		const startHeight = wrapper.offsetHeight;
		wrapper.style.height = startHeight + 'px';
		wrapper.style.overflow = 'hidden'; 
		
		// 2. Ejecutamos TU cambio de pestañas original (con tu fade sutil)
		const tabContents = document.querySelectorAll('.tab-content');
		tabContents.forEach(content => content.classList.remove('active'));
		
		const tabButtons = document.querySelectorAll('.tab-btn');
		tabButtons.forEach(button => button.classList.remove('active'));
		
		const selectedTab = document.getElementById(tabId);
		if (selectedTab) selectedTab.classList.add('active');
		
		const clickedButton = event?.currentTarget || document.querySelector(`[onclick*="${tabId}"]`);
		if (clickedButton) clickedButton.classList.add('active');

		// 3. Medimos en secreto cuánto necesita medir ahora
		wrapper.style.height = 'auto';
		const targetHeight = wrapper.offsetHeight;
		wrapper.style.height = startHeight + 'px'; // Volvemos a la altura congelada
		
		// Forzamos al navegador a procesar el cálculo
		wrapper.offsetHeight; 
		
		// 4. Animamos la caja blanca (empujando o atrayendo el footer suavemente)
		wrapper.style.transition = 'height 0.3s ease';
		wrapper.style.height = targetHeight + 'px';
		
		// 5. Limpieza al terminar
		setTimeout(() => {
			wrapper.style.transition = '';
			wrapper.style.height = 'auto';
			wrapper.style.overflow = 'visible';
		}, 300);
	}

	// ---------------------------------------------
	// 5. OTRAS FUNCIONES SPA
	// ---------------------------------------------
	function showSection(sectionId, isInitialLoad) {
		document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
		const target = document.getElementById(sectionId);
		if (target) target.classList.remove('hidden');
		document.getElementById("mainNav").classList.remove("active");
		
		if (history.pushState && window.location.hash !== "#" + sectionId) {
			// FIX 1: Diferenciamos el click del usuario vs. la carga de página inicial.
			// Si es un click normal, limpiamos los parámetros sucios de la URL con window.location.pathname.
			// Si es carga inicial o atrás/adelante, mantenemos la URL igual para no borrar el enlace copiado.
			if (isInitialLoad === false) {
				history.pushState({ section: sectionId }, "", "#" + sectionId);
			} else {
				history.pushState({ section: sectionId }, "", window.location.pathname + "#" + sectionId);
			}
		}

		document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
		const menuMap = {'home':0, 'catalogo':1, 'fuentes':2, 'diccionarios':3, 'novedades':4, 'faq':5};
		const navLinks = document.querySelectorAll('.nav-link');
		if(navLinks[menuMap[sectionId]]) navLinks[menuMap[sectionId]].classList.add('active');
		const ivorySection = document.querySelector('.ivory-section');
			if (ivorySection) {
				ivorySection.style.display = sectionId === 'home' ? 'block' : 'none';
			}
			
		// PASAMOS LA BARREDORA AL CAMBIAR DE SECCIÓN
		limpiarFormularios();
			
		window.scrollTo({ top: 0, behavior: 'instant' });
	}

	window.onpopstate = function(event) {
		if (resultsModal.style.display === 'flex' || fuentesModal.style.display === 'flex') {
			resultsModal.style.display = 'none';
			fuentesModal.style.display = 'none';
			desbloquearScroll();
			return; 
		}

		if (event.state && event.state.section) {
			showSection(event.state.section, false);
		} else {
			showSection('home', false);
		}
	};

	function toggleMenu() { document.getElementById("mainNav").classList.toggle("active"); }


	// ---------------------------------------------
	// 6. LÓGICA DE BÚSQUEDA Y MODAL 
	// ---------------------------------------------
	const resultsModal = document.getElementById('results-modal');
	const loadingIndicator = document.getElementById('loading-indicator');
	const resultsFrame = document.getElementById('resultsFrame');

	function closeModal() {
		resultsModal.style.display = 'none';
		resultsFrame.src = 'about:blank';
		desbloquearScroll();
		
		const title = document.getElementById('modal-resultados-titulo');
		if (title) title.textContent = 'Catálogo';
		
		limpiarFormularios();

		// FIX: Leemos la sección donde estamos parados para limpiar la URL correctamente
		let seccionActual = "home";
		document.querySelectorAll('.page-section').forEach(sec => {
			if (!sec.classList.contains('hidden')) {
				seccionActual = sec.id;
			}
		});
		
		const urlLimpia = window.location.pathname + "#" + seccionActual;
		window.history.replaceState(null, '', urlLimpia);

		if (window.location.hash === "#resultados" || window.location.hash === "#fuente-detalle" || window.location.hash === "#indice-revistas") {
			history.back();
		}
	}

	// --- NUEVA FUNCIÓN PARA EL ÍNDICE KARDEX ---
	function openIndiceKardex() {
		const title = document.getElementById('modal-resultados-titulo');
		const loaderText = document.getElementById('modal-resultados-loader-text');
		
		if (title) title.innerHTML = '<i class="fas fa-book-open"></i> Índice de Revistas';
		if (loaderText) loaderText.textContent = 'Cargando Índice...';
		
		resultsModal.style.display = 'flex';
		loadingIndicator.style.display = 'flex';
		resultsFrame.style.opacity = '0.3';
		
		// ---> SOLUCIÓN PANTALLA BLANCA <---
		const urlKardex = '/cgi-bin/wxis/wxis.exe?IsisScript=karind.xis&base=kardex&busca1=TI=A&inf=1';
		if (resultsFrame.contentWindow) {
			resultsFrame.contentWindow.location.replace(urlKardex);
		} else {
			resultsFrame.src = urlKardex;
		}
		
		bloquearScroll();
		if (history.pushState) {
			history.pushState({ modalOpen: true }, "", "#indice-revistas");
		}
	}

	// VARIABLE GLOBAL PARA GUARDAR LA BÚSQUEDA
	window.currentSearchQuery = "";

	function submitSearch(form) {
		window.currentRecordTitle = "";
		const inputs = form.querySelectorAll('input[type="text"]');
		let valid = false;
		inputs.forEach(input => { if(input.value.trim().length > 0) valid = true; });
		if(!valid) { alert("Por favor, ingrese un término de búsqueda."); return false; }

		const title = document.getElementById('modal-resultados-titulo');
		const loaderText = document.getElementById('modal-resultados-loader-text');

		const isScript = form.querySelector('input[name="IsisScript"]');
		if (isScript && isScript.value === 'diccionarios.xis') {
			if (title) title.innerHTML = '<i class="fas fa-book"></i> Diccionarios Técnicos';
			if (loaderText) loaderText.textContent = 'Buscando en los Diccionarios...';
		} else {
			if (title) title.innerHTML = '<i class="fas fa-search-plus"></i> Catálogo';
			if (loaderText) loaderText.textContent = 'Buscando en el Catálogo...';
		}

		resultsModal.style.display = 'flex';
		loadingIndicator.style.display = 'flex';
		resultsFrame.style.opacity = '0.3';
		resultsFrame.style.height = '350px';
		
		bloquearScroll();
		if (history.pushState) {
			history.pushState({ modalOpen: true }, "", "#resultados");
		}
		
		// Limpieza básica inicial
		var busca1Input = form.querySelector('input[name="busca1"]');
		if (busca1Input) busca1Input.value = busca1Input.value.replace(/\x27/g, " ").replace(/¿/g, " ").replace(/\?/g, " ").replace(/\s+/g, " ").trim();
		var tituloInput = form.querySelector('input[name="titulo"]');
		if (tituloInput) tituloInput.value = tituloInput.value.replace(/\x27/g, " ").replace(/\x3F/g, " ").replace(/\xBF/g, " ").replace(/\s+/g, " ").trim();
		var autorInput = form.querySelector('input[name="autor"]');
		if (autorInput) autorInput.value = autorInput.value.replace(/\x3F/g, " ").replace(/\xBF/g, " ").replace(/\s+/g, " ").trim();
		var temaInput = form.querySelector('input[name="tema"]');
		if (temaInput) temaInput.value = temaInput.value.replace(/\x27/g, " ").replace(/\x3F/g, " ").replace(/\xBF/g, " ").replace(/\s+/g, " ").trim();
		
		// ---> EL TRADUCTOR ISO-8859-1 (CON MAPPING NATIVO WINDOWS-1252) <---
		const cp1252Map = { 
			8216: '91', // Comilla simple izq ‘
			8217: '92', // Comilla simple der ’
			8220: '93', // Comilla doble izq “
			8221: '94', // Comilla doble der ”
			8226: '95', // Viñeta •
			8211: '96', // Guion medio –
			8212: '97', // Guion largo —
			8230: '85', // Puntos suspensivos …
			8364: '80', // Euro €
			8482: '99'  // Marca registrada ™
		};

		const formData = new FormData(form);
		let isoParamsArray = [];
		
		for (const [key, value] of formData.entries()) {
			let valLimpio = value.trim();
			
			if (valLimpio !== '') {
				
				// ---> DEVOLVEMOS ESTO: Matamos el grado acá para que ISIS ni lo vea <---
				valLimpio = valLimpio
					.replace(/°/g, ' ')
					.replace(/º/g, ' ');

				if (valLimpio.normalize) valLimpio = valLimpio.normalize("NFC");

				let encodedVal = "";
				for (let i = 0; i < valLimpio.length; i++) {
					let char = valLimpio.charAt(i);
					let code = valLimpio.charCodeAt(i);

					if (char === ' ') {
						encodedVal += '+'; // ISIS clásico prefiere el +
					} 
					else if (code <= 127) {
						encodedVal += encodeURIComponent(char);
					} 
					else if (code <= 255) {
						let hex = code.toString(16).toUpperCase();
						if (hex.length === 1) hex = "0" + hex;
						encodedVal += "%" + hex;
					} 
					else if (cp1252Map[code]) {
						encodedVal += "%" + cp1252Map[code];
					}
					else {
						encodedVal += encodeURIComponent(char);
					}
				}
				isoParamsArray.push(encodeURIComponent(key) + '=' + encodedVal);
			}
		}
		
		const finalQueryString = isoParamsArray.join('&');
		window.currentSearchQuery = finalQueryString;
		
		const urlConParams = window.location.pathname + '?' + finalQueryString + '#resultados';
		window.history.replaceState(null, '', urlConParams);

		const actionUrl = form.getAttribute('action') || '/cgi-bin/wxis/wxis.exe';
		const finalUrl = actionUrl + '?' + finalQueryString;

		if (resultsFrame.contentWindow) {
			resultsFrame.contentWindow.location.replace(finalUrl);
		} else {
			resultsFrame.src = finalUrl;
		}

		return false; 
	}

	function onIframeLoad() {
		const loadingIndicator = document.getElementById('loading-indicator');
		if (loadingIndicator) loadingIndicator.style.display = 'none';
		
		const resultsFrame = document.getElementById('resultsFrame');
		if (resultsFrame) resultsFrame.style.opacity = '1';
		
		const scrollContainer = document.querySelector('.iframe-container');
		if (scrollContainer) {
			scrollContainer.scrollTop = 0;
		}

		// ---> MAGIA: Sincronización cruda y conversión a GET <---
		if (resultsFrame) {
			try {
				const iframeDoc = resultsFrame.contentDocument || resultsFrame.contentWindow.document;
				if (iframeDoc) {
					// Obligamos a ISIS a usar GET en sus formularios internos (ej: Refinar Búsqueda)
					// para que la URL nunca quede oculta al navegar atrás o adelante.
					iframeDoc.querySelectorAll('form').forEach(form => {
						if (form.method.toLowerCase() === 'post') {
							form.method = 'get';
						}
					});
				}

				const iframeUrl = resultsFrame.contentWindow.location.search;
				if (iframeUrl && iframeUrl.length > 1) {
					// Tomamos el string 100% CRUDO, sin tocar la codificación ISO de ISIS
					const rawQuery = iframeUrl.substring(1);

					if (window.currentSearchQuery !== rawQuery) {
						window.currentSearchQuery = rawQuery;
						
						const urlSincronizada = window.location.pathname + '?' + rawQuery + window.location.hash;
						window.history.replaceState(null, '', urlSincronizada);

						const title = document.getElementById('modal-resultados-titulo');
						if (title) {
							if (rawQuery.includes('diccionarios.xis')) {
								title.innerHTML = '<i class="fas fa-book"></i> Diccionarios Técnicos';
							} else {
								title.innerHTML = '<i class="fas fa-search-plus"></i> Catálogo';
							}
						}
					}
				}
			} catch(e) {}
		}
		
		actualizarBotonGuardar();
	}

	// ESCUCHADOR DE ALTURA SEGURO Y EVENTOS (BIMODAL)
	window.addEventListener("message", function(event) {
		// SEGURIDAD: Ignorar mensajes de cualquier origen que no sea el propio servidor.
		// Esto previene que otras pestañas o páginas maliciosas manipulen el estado del sitio.
		if (event.origin !== window.location.origin) return;

		// 1. Si el iframe pide cerrar el modal
		if (event.data === "cerrarModal") {
				closeModal();
				return;
			}

		// ---> NUEVO: Si el iframe avisa que cambió de página <---
		if (typeof event.data === "object" && event.data.tipo === "updateUrl") {
			// Tomamos la query tal cual viene, sin intentar limpiar el UTF-8
			let rawQuery = event.data.query;
			
			window.currentSearchQuery = rawQuery; 
			const urlSincronizada = window.location.pathname + '?' + rawQuery + window.location.hash;
			window.history.replaceState(null, '', urlSincronizada);
			return;
		}

		// 2. Si el iframe avisa que es el Catálogo
		if (event.data === "setCatalogoTitle") {
			const title = document.getElementById('modal-resultados-titulo');
			if (title) title.innerHTML = '<i class="fas fa-search-plus"></i> Catálogo';
			return;
		}

		// 3. Si el iframe avisa que es el Diccionario
		if (event.data === "setDiccionarioTitle") {
			const title = document.getElementById('modal-resultados-titulo');
			if (title) title.innerHTML = '<i class="fas fa-book"></i> Diccionarios Técnicos';
			return;
		}

		// 4. Si el iframe envía un número (para ajustar la altura)
		if (typeof event.data === "number") {
			const iframeResults = document.getElementById("resultsFrame");
			const iframeFuentes = document.getElementById("fuentesFrame");

			if (iframeResults && event.source === iframeResults.contentWindow) {
				iframeResults.style.height = event.data + "px";
			} 
			else if (iframeFuentes && event.source === iframeFuentes.contentWindow) {
				iframeFuentes.style.height = event.data + "px";
			}
		}
	}, false);

	// ---------------------------------------------
	// 7. FUNCIONES PARA EL MODAL DE FUENTES
	// ---------------------------------------------
	const fuentesModal = document.getElementById('fuentes-modal');
	const fuentesLoadingIndicator = document.getElementById('fuentes-loading-indicator');
	const fuentesFrame = document.getElementById('fuentesFrame');

	function openFuentesModal(url, elementoOrigen) {
		// SEGURIDAD: Lista blanca de rutas permitidas en el iframe de fuentes.
		// Solo se aceptan URLs que apunten al CGI de wxis en el mismo servidor.
		// Esto previene que alguien cargue contenido externo en el iframe.
		const esUrlPermitida = (
			typeof url === 'string' &&
			(
				url.startsWith('/cgi-bin/wxis/') ||
				url.startsWith('../../cgi-bin/wxis/')
			)
		);

		if (!esUrlPermitida) {
			console.warn('openFuentesModal: URL bloqueada por política de seguridad:', url);
			return;
		}

		construirBreadcrumb(elementoOrigen || null);
		fuentesModal.style.display = 'flex';
		fuentesLoadingIndicator.style.display = 'flex';
		fuentesFrame.style.opacity = '0.3';
		
		if (fuentesFrame.contentWindow) {
			fuentesFrame.contentWindow.location.replace(url);
		} else {
			fuentesFrame.src = url;
		}

		bloquearScroll();
		if (history.pushState) {
			history.pushState({ modalOpen: true }, "", "#fuente-detalle");
		}
	}

	function closeFuentesModal() {
		fuentesModal.style.display = 'none';
		desbloquearScroll();

		// FIX 5: LIMPIEZA DE URL AL CERRAR PARA EVITAR LA TRAMPA MORTAL
		const urlLimpia = window.location.pathname + "#fuentes";
		window.history.replaceState(null, '', urlLimpia);
		
		setTimeout(() => {
			fuentesFrame.src = 'about:blank';
		}, 300);
		
		// PASAMOS LA BARREDORA
		limpiarFormularios();
		
		if (window.location.hash === "#fuente-detalle") {
			history.back();
		}
	}

	function onFuentesIframeLoad() {
		fuentesLoadingIndicator.style.display = 'none';
		fuentesFrame.style.opacity = '1';
		injectStylesToIframe(fuentesFrame);
	}

	fuentesModal.addEventListener('click', function(e) {
		if (e.target === fuentesModal) {
			closeFuentesModal();
		}
	});

	// ---------------------------------------------
	// LÓGICA DEL BOTÓN FLOTANTE PARA EL MODAL DE FUENTES
	// ---------------------------------------------
	(function() {
		const modalF = document.getElementById('fuentes-modal');
		if (!modalF) return;

		// Buscamos EXACTAMENTE tu clase constructora del scroll
		const scrollContainerF = modalF.querySelector('.modal-fuentes-iframe-container') || modalF; 
		const btnScrollF = document.getElementById('fuentesScrollFab');
		let apuntaAbajoF = true;

		if (!btnScrollF) return;

		const iconoF = btnScrollF.querySelector('i');

		scrollContainerF.addEventListener('scroll', function() {
			const scrolled = scrollContainerF.scrollTop; 
			const total = scrollContainerF.scrollHeight - scrollContainerF.clientHeight; 
			const porcentaje = total > 0 ? scrolled / total : 0;

			if (scrolled > 200) {
				btnScrollF.classList.add('visible');
			} else {
				btnScrollF.classList.remove('visible');
			}

			if (porcentaje > 0.85) {
				btnScrollF.title = "Volver arriba";
				if (iconoF) iconoF.style.transform = "rotate(180deg)"; 
				apuntaAbajoF = false;
			} else {
				btnScrollF.title = "Ir al final";
				if (iconoF) iconoF.style.transform = "rotate(0deg)"; 
				apuntaAbajoF = true;
			}
		});

		function hacerScrollF(e) {
			if (e) e.preventDefault(); 
			if (apuntaAbajoF) {
				scrollContainerF.scrollTo({ top: scrollContainerF.scrollHeight, behavior: 'smooth' });
			} else {
				scrollContainerF.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}

		btnScrollF.addEventListener('click', hacerScrollF);
		btnScrollF.addEventListener("touchstart", hacerScrollF);
	})();

	// ---------------------------------------------
	// 8. HINT DINÁMICO SELECTOR DE BASES (BÚSQUEDA SIMPLE)
	// ---------------------------------------------
	(function() {
		const hints = {
			'inti':   'Contiene libros, documentos, monografías, artículos, tesis, etc. También contiene normas sin acceso al documento',
			'cat':    'Contiene libros, documentos, monografías, artículos, tesis, etc.',
			'kardex': 'Contiene revistas o publicaciones periódicas (no contiene artículos) <span style="margin: 0 10px; border-left: 2px solid #ccc; display: inline-block; height: 14px; vertical-align: middle;"></span> <a href="#" onclick="openIndiceKardex(); return false;" style="color: var(--primary); font-weight: 600; text-decoration: none; white-space: nowrap;"><i class="fas fa-list-ol"></i> Abrir Índice de Revistas</a>',
			'norma':  'Contiene normas técnicas con acceso al documento en la red del INTI'
		};
		const hintText = document.getElementById('db-hint-text');

		document.querySelectorAll('#tab-simple input[name="base"].db-radio').forEach(radio => {
			radio.addEventListener('change', () => {
				if (!hintText || !hints[radio.value]) return;
				hintText.style.opacity = '0';
				setTimeout(() => {
					// SEGURIDAD: Usamos innerHTML solo porque el contenido de 'hints' es HTML
					// estático definido por nosotros en este mismo archivo, nunca por el usuario.
					// Si este objeto llegara a alimentarse desde fuera, esto debe cambiar a nodos DOM.
					hintText.innerHTML = hints[radio.value] || '';
					hintText.style.transition = 'opacity 0.25s';
					hintText.style.opacity = '1';
				}, 150);
			});
		});
	})();

	// =========================================
	// 9. BÚSQUEDA AVANZADA (CON FOOTER FLUIDO, LABELS ANIMADOS Y HINTS DINÁMICOS)
	// =========================================
	function toggleTipoDocumento(baseValue) {
		const wrapper = document.querySelector('.catalog-wrapper');
		
		// 1. Congelar altura
		const startHeight = wrapper.offsetHeight;
		wrapper.style.height = startHeight + 'px';
		wrapper.style.overflow = 'hidden';

		// --- Micro-función para animar el cambio de textos ---
		function cambiarTextoSuave(elemento, nuevoHTML) {
			if (!elemento) return;
			elemento.style.opacity = '0';
			setTimeout(() => {
				elemento.innerHTML = nuevoHTML;
				elemento.style.opacity = '1';
			}, 150);
		}

		// --- CAPTURAMOS LOS ELEMENTOS ---
		const picklistGroup = document.getElementById('group-tipo-doc');
		const picklistSelect = picklistGroup ? picklistGroup.querySelector('select') : null;
		
		const labelAutor = document.getElementById('label-autor');
		const inputAutor = document.querySelector('input[name="autor"]'); // Capturamos el casillero
		
		const labelTitulo = document.getElementById('label-titulo');
		const inputTitulo = document.querySelector('input[name="titulo"]'); // Capturamos el casillero
		
		const labelAnioIssn = document.getElementById('label-anio-issn');
		const inputAnioIssn = document.getElementById('input-anio-issn');
		
		const inputTema = document.querySelector('input[name="tema"]'); // Capturamos el casillero de Tema

		// LÓGICA DE AUTOR / INSTITUCIÓN
		if (picklistGroup) {
			if (baseValue === 'inti' || baseValue === 'cat') {
				picklistGroup.style.display = 'flex';
				if (picklistSelect) picklistSelect.disabled = false;
				if (labelAutor) cambiarTextoSuave(labelAutor, '<i class="fas fa-user-tie" style="color: var(--primary);"></i> Autor o Institución');
				if (inputAutor) inputAutor.placeholder = 'Apellido, Nombre, Organismo o Sigla';
			} else if (baseValue === 'norma') {
				picklistGroup.style.display = 'none';
				if (picklistSelect) { picklistSelect.disabled = true; picklistSelect.value = ''; }
				if (labelAutor) cambiarTextoSuave(labelAutor, '<i class="fas fa-user-tie" style="color: var(--primary);"></i> Organismo Emisor');
				if (inputAutor) inputAutor.placeholder = 'Ej: IRAM, ISO, ASTM, MERCOSUR';
			} else { // kardex
				picklistGroup.style.display = 'none';
				if (picklistSelect) { picklistSelect.disabled = true; picklistSelect.value = ''; }
				if (labelAutor) cambiarTextoSuave(labelAutor, '<i class="fas fa-user-tie" style="color: var(--primary);"></i> Autor Institucional');
				if (inputAutor) inputAutor.placeholder = 'Organismo editor, Institución o Sigla';
			}
		}
		
		// LÓGICA DE AÑO / ISSN
		if (labelAnioIssn && inputAnioIssn) {
			if (baseValue === 'kardex') {
				cambiarTextoSuave(labelAnioIssn, '<i class="fas fa-barcode" style="color: var(--primary);"></i> ISSN');
				setTimeout(() => {
					inputAnioIssn.name = 'issn';
					inputAnioIssn.placeholder = 'Ej: 0123-4567';
					inputAnioIssn.value = ''; 
				}, 150);
			} else {
				cambiarTextoSuave(labelAnioIssn, '<i class="fas fa-calendar-alt" style="color: var(--primary);"></i> Año');
				setTimeout(() => {
					inputAnioIssn.name = 'anio';
					inputAnioIssn.placeholder = 'Ej: 2023 (Dejar en blanco para todos)';
					inputAnioIssn.value = ''; 
				}, 150);
			}
		}
		
		// LÓGICA DE TÍTULO
		if (labelTitulo && inputTitulo) {
			if (baseValue === 'cat') {
				// Para Catálogo: Solo título y placeholder genérico
				cambiarTextoSuave(labelTitulo, '<i class="fas fa-book-open" style="color: var(--primary);"></i> Título');
				inputTitulo.placeholder = 'Palabras incluidas en el título';
			} else if (baseValue === 'inti' || baseValue === 'norma') {
				// Para Libros+Normas e INTI: Incluye Código y placeholder específico
				cambiarTextoSuave(labelTitulo, '<i class="fas fa-book-open" style="color: var(--primary);"></i> Título o Código de Documento');
				inputTitulo.placeholder = 'Código (ej: IRAM 1534) o palabras del título';
			} else { 
				// Para Kardex: Solo título y placeholder de publicaciones
				cambiarTextoSuave(labelTitulo, '<i class="fas fa-book-open" style="color: var(--primary);"></i> Título');
				inputTitulo.placeholder = 'Nombre de la publicación o revista';
			}
		}

		// HINT GLOBAL PARA TEMA (Aplica igual a todas, pero te lo dejo configurado)
		if (inputTema) {
			inputTema.placeholder = 'Términos, materias o conceptos clave';
		}
		
		// HINTS DEL FOOTER (Esto queda igual que como lo tenías)
		const hints = {
			'inti':   'Contiene libros, documentos, monografías, artículos, tesis, etc. También contiene normas sin acceso al documento',
			'cat':    'Contiene libros, documentos, monografías, artículos, tesis, etc.',
			'kardex': 'Contiene revistas o publicaciones periódicas (no contiene artículos) <span style="margin: 0 10px; border-left: 2px solid #ccc; display: inline-block; height: 14px; vertical-align: middle;"></span> <a href="#" onclick="openIndiceKardex(); return false;" style="color: var(--primary); font-weight: 600; text-decoration: none; white-space: nowrap;"><i class="fas fa-list-ol"></i> Abrir Índice de Revistas</a>',
			'norma':  'Contiene normas técnicas con acceso al documento en la red del INTI'
		};
		const hintTextAvanzada = document.getElementById('db-hint-text-avanzada');
		if (hintTextAvanzada && hints[baseValue]) {
			hintTextAvanzada.style.opacity = '0';
			setTimeout(() => {
				hintTextAvanzada.innerHTML = hints[baseValue] || '';
				hintTextAvanzada.style.transition = 'opacity 0.25s';
				hintTextAvanzada.style.opacity = '1';
			}, 150);
		}
		
		// FILTRO INTI (Igual que como lo tenías)
		const filtroInti = document.getElementById('filtro_inti');
		const filtroIntiLabel = filtroInti ? filtroInti.closest('label') : null;
		if (filtroIntiLabel) {
			filtroIntiLabel.style.visibility = (baseValue === 'inti' || baseValue === 'cat') ? 'visible' : 'hidden';
		}

		// 2. Animar contenedor al nuevo tamaño
		wrapper.style.height = 'auto';
		const targetHeight = wrapper.offsetHeight;
		wrapper.style.height = startHeight + 'px';
		wrapper.offsetHeight; 

		wrapper.style.transition = 'height 0.3s ease';
		wrapper.style.height = targetHeight + 'px';

		setTimeout(() => {
			wrapper.style.transition = '';
			wrapper.style.height = 'auto';
			wrapper.style.overflow = 'visible';
		}, 300);
	}

	// ---------------------------------------------
	// 10. GOOGLE MAPS EN "CÓMO LLEGAR"
	// ---------------------------------------------
	function toggleModalMapa(e) {
		if (e) e.preventDefault();
		const modal = document.getElementById('modal-mapa');
		const visible = modal.style.display === 'flex';
		modal.style.display = visible ? 'none' : 'flex';
		!visible ? bloquearScroll() : desbloquearScroll();
	}

	// ---------------------------------------------
	// 11. BLOQUEO/DESBLOQUEO DE SCROLL
	// ---------------------------------------------		
	function bloquearScroll() {
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		document.documentElement.style.paddingRight = scrollbarWidth + 'px';
		document.documentElement.classList.add('modal-open');
	}

	function desbloquearScroll() {
		document.documentElement.classList.remove('modal-open');
		document.documentElement.style.paddingRight = '';
	}

	// ---------------------------------------------
	// 12. INICIALIZACIÓN
	// ---------------------------------------------
	document.addEventListener('DOMContentLoaded', () => {
		document.getElementById('resultsFrame').src = 'about:blank';
		document.getElementById('fuentesFrame').src = 'about:blank';

		const hash = window.location.hash.replace('#', '');
		const secciones = ['home', 'catalogo', 'fuentes', 'diccionarios', 'novedades', 'faq'];
		let seccionInicial = secciones.includes(hash) ? hash : 'home';
		if (hash === 'resultados') seccionInicial = 'catalogo'; // Que el fondo espere en catálogo

		// Ejecutamos la lógica de armado de página
		showSection(seccionInicial, false);
		renderNews();
		toggleScrollButton();
		toggleTipoDocumento('inti');

		// Usamos un requestAnimationFrame anidado (doble rAF).
        // Esto le dice al navegador: "Esperá a que termine de procesar 
        // todo este JavaScript, dibujá el primer frame, y justo ANTES 
        // de mostrar el segundo frame, ejecutá esto".
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
                // 1. Clavamos el scroll arriba
				window.scrollTo({
					top: 0,
					left: 0,
					behavior: 'instant' 
				});
                
                // 2. Quitamos la cortina instantáneamente
                document.body.classList.add('listo');
			});
		});


		const toggleElements = document.querySelectorAll('.clickable-toggle-fuentes');
		toggleElements.forEach(toggle => {
			toggle.addEventListener('click', (e) => {
				e.stopPropagation();
				const parentOption = toggle.closest('.fuentes-menu-option');
				const submenu = parentOption.querySelector('.fuentes-submenu, .fuentes-sub-submenu');
				if (!submenu) return;
				const parentContainer = parentOption.parentElement;
				if (parentContainer.classList.contains('fuentes-submenu') || 
					parentContainer.classList.contains('fuentes-sub-submenu') || 
					parentContainer.classList.contains('fuentes-menu-container')) {
					const siblings = parentContainer.children;
					for (let sibling of siblings) {
						if (sibling !== parentOption && sibling.classList.contains('fuentes-menu-option')) {
							const siblingMenu = sibling.querySelector('.fuentes-submenu, .fuentes-sub-submenu');
							if (siblingMenu) {
								siblingMenu.classList.remove('active');
								sibling.classList.remove('active');
							}
						}
					}
				}
				parentOption.classList.toggle('active');
				submenu.classList.toggle('active');
			});
		});

		document.addEventListener('click', () => {
			const activeMenus = document.querySelectorAll('.fuentes-submenu.active, .fuentes-sub-submenu.active');
			activeMenus.forEach(menu => {
				menu.classList.remove('active');
				const parentOption = menu.closest('.fuentes-menu-option');
				if (parentOption) parentOption.classList.remove('active');
			});
		});
		
		document.addEventListener('click', function(event) {
			const menu = document.querySelector('.nav-menu');
			const toggleBoton = document.querySelector('.mobile-toggle');

			// Si el menú no existe en la página o el botón tampoco, no hace nada
			if (!menu || !toggleBoton) return;

			// Comprobamos si el menú está desplegado
			const menuAbierto = menu.classList.contains('active');

			// Si está abierto Y el clic NO fue en el menú Y el clic NO fue en el botón sándwich
			if (menuAbierto && !menu.contains(event.target) && !toggleBoton.contains(event.target)) {
				
				// Le quitamos la clase 'active' para que se repliegue
				menu.classList.remove('active');
				
				// Opcional: si tu botón sándwich usa alguna clase para cambiar su forma (ej. a una X), removela acá:
				// toggleBoton.classList.remove('active'); 
			}
		});

		const submenus = document.querySelectorAll('.fuentes-submenu, .fuentes-sub-submenu');
		submenus.forEach(menu => {
			menu.addEventListener('click', (e) => { e.stopPropagation(); });
		});

		const searchInputs = document.querySelectorAll('.fuentes-search-input');
		searchInputs.forEach(input => {
			input.addEventListener('focus', function() { this.parentElement.style.transform = 'translateY(-2px)'; });
			input.addEventListener('blur', function() { this.parentElement.style.transform = 'translateY(0)'; });
		});

		const alphaItems = document.querySelectorAll('.fuentes-alpha-item');
		alphaItems.forEach((item, index) => {
			item.style.opacity = '0';
			item.style.transform = 'translateY(10px)';
			setTimeout(() => {
				item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
				item.style.opacity = '1';
				item.style.transform = 'translateY(0)';
			}, 100 + index * 30);
		});
	});


	// --- FUNCIONES EXCLUSIVAS DE LA SECCIÓN DICCIONARIOS ---
	function toggleResenaDicc(btnElement) {
		const resenaDiv = btnElement.closest('.card-header').nextElementSibling;
		resenaDiv.classList.toggle('abierto');
		
		const icon = btnElement.querySelector('i');
		
		if (resenaDiv.classList.contains('abierto')) {
			// Abierto: Cruz y color gris para cederle protagonismo al texto
			icon.classList.replace('fa-info-circle', 'fa-times');
			btnElement.style.color = '#999'; 
		} else {
			// Cerrado: Vuelve el ícono de info y tu azul institucional
			icon.classList.replace('fa-times', 'fa-info-circle');
			btnElement.style.color = 'var(--primary)'; 
			// Alternativa más limpia: btnElement.style.removeProperty('color'); para que el CSS tome el control de nuevo.
		}
	}

	function toggleAvanzadaDicc(element) {
		const advancedDiv = element.nextElementSibling;
		const icon = element.querySelector('i');
		advancedDiv.classList.toggle('abierto');
		
		if (advancedDiv.classList.contains('abierto')) {
			icon.classList.replace('fa-plus-circle', 'fa-minus-circle');
			element.innerHTML = '<i class="fas fa-minus-circle"></i> Ocultar opciones';
		} else {
			icon.classList.replace('fa-minus-circle', 'fa-plus-circle');
			element.innerHTML = '<i class="fas fa-plus-circle"></i> B&uacute;squeda combinada';
		}
	}

	function toggleAyudaDicc(element) {
		const ayudaDiv = element.nextElementSibling;
		ayudaDiv.classList.toggle('abierto');
	}

	// ---------------------------------------------
	// 13. PANEL LATERAL DE CONTACTO
	// ---------------------------------------------
	function toggleContactPanel() {
		const panel = document.getElementById('side-contact-panel');
		const backdrop = document.getElementById('contact-backdrop');
		
		if (panel && backdrop) {
			const isAbierto = panel.classList.toggle('abierto');
			backdrop.classList.toggle('activo', isAbierto);
			
			// En lugar de solo togglear la clase, usamos tus funciones "inteligentes"
			if (isAbierto) {
				bloquearScroll(); // Esta función ya calcula los px de la barra
			} else {
				desbloquearScroll(); // Esta función limpia el padding y restaura el scroll
			}
		}
	}

	// Cierre extra por seguridad (Tecla ESC)
	document.addEventListener('keydown', function(event) {
		if (event.key === 'Escape') {
			const panel = document.getElementById('side-contact-panel');
			if (panel && panel.classList.contains('abierto')) {
				toggleContactPanel();
			}
		}
	});

	// Nota: Ya no hace falta el evento "click afuera" complejo en JS porque 
	// el atributo onclick="toggleContactPanel()" en el HTML del backdrop 
	// hace exactamente el mismo trabajo de forma más limpia y directa.

	// =========================================
	// NOTIFICACIÓN MODERNA (TOAST)
	// =========================================
	function mostrarToast(mensaje) {
		// Si ya hay un cartelito abierto, lo borramos para no acumular
		let oldToast = document.getElementById('link-toast');
		if (oldToast) oldToast.remove();

		// Creamos el div de la notificación
		let toast = document.createElement('div');
		toast.id = 'link-toast';
		toast.className = 'toast-notification';
		toast.innerHTML = `<i class="fas fa-check-circle" style="color: #4caf50; font-size: 1.1rem;"></i> ${mensaje}`;
		document.body.appendChild(toast);

		// Disparamos la animación de subida
		setTimeout(() => toast.classList.add('show'), 10);

		// Lo escondemos y borramos después de 3 segundos
		setTimeout(() => {
			toast.classList.remove('show');
			setTimeout(() => toast.remove(), 400);
		}, 3000);
	}

	// =========================================
	// DEEP LINKING: COPIAR ENLACE Y LEER URL
	// =========================================
	function copiarEnlaceBusqueda() {
		let queryStr = "";
		let iframe = document.getElementById('resultsFrame');
		
		// Leemos la URL EXACTA y CRUDA del iframe
		try {
			const iframeUrl = iframe.contentWindow.location.search;
			if (iframeUrl && iframeUrl.length > 1) {
				queryStr = iframeUrl.substring(1); // Cero procesamiento, puro ISO-8859-1
			}
		} catch(e) {}

		if (!queryStr) queryStr = window.currentSearchQuery;
		if (!queryStr) queryStr = window.location.search.substring(1);

		if (!queryStr) {
			mostrarToast("Realice una búsqueda para copiar el enlace.");
			return;
		}

		const urlBase = window.location.origin + window.location.pathname;
		const urlCompartir = urlBase + '?' + queryStr + '#resultados';

		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(urlCompartir).then(() => {
				mostrarToast("Enlace copiado al portapapeles");
			}).catch(() => {
				prompt("Copiá este enlace manualmente:", urlCompartir);
			});
		} else {
			let textArea = document.createElement("textarea");
			textArea.value = urlCompartir;
			textArea.style.position = "fixed";
			textArea.style.top = "0";
			textArea.style.left = "0";
			textArea.style.opacity = "0";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				let exitoso = document.execCommand('copy');
				if (exitoso) {
					mostrarToast("Enlace copiado al portapapeles");
				} else {
					prompt("Copiá este enlace manualmente:", urlCompartir);
				}
			} catch (err) {
				prompt("Copiá este enlace manualmente:", urlCompartir);
			}
			document.body.removeChild(textArea);
		}
	}

	// Lector de URLs al abrir la página
	document.addEventListener('DOMContentLoaded', () => {
		// FIX: NO usamos URLSearchParams porque destruye el ISO-8859-1 al forzar UTF-8.
		// Leemos la URL cruda y pura directamente.
		const rawSearch = window.location.search.substring(1);
		
		// Si la URL tiene parámetros de Isis, PERO NO es de la guía de fuentes...
		if (rawSearch.includes('IsisScript=') && !rawSearch.includes('fuentes')) {
			
			let isoParams = [];
			let pairs = rawSearch.split('&');
			
			// ---> EL TRADUCTOR DE ENLACES COMPARTIDOS (A PRUEBA DE F5) <---
			for (let i = 0; i < pairs.length; i++) {
				if (!pairs[i]) continue;
				let kv = pairs[i].split('=');
				let key = kv[0];
				let val = kv.length > 1 ? kv.slice(1).join('=') : '';
				
				let encodedValue = "";
				try {
					// INTENTO 1: ¿Es un enlace moderno de WhatsApp/Mail en UTF-8?
					
					// SOLUCIÓN: Reemplazamos los "+" por espacios ANTES de decodificar
					// Esto salva al operador OR (%2B) de ser confundido con un espacio
					let valConEspacios = val.replace(/\+/g, ' '); 
					let decoded = decodeURIComponent(valConEspacios);
					
					if (decoded.normalize) decoded = decoded.normalize("NFC"); // Une tildes
					
					// Lo traducimos a ISO-8859-1 para que ISIS lo entienda
					for (let j = 0; j < decoded.length; j++) {
						let code = decoded.charCodeAt(j);
						if (code <= 127) encodedValue += encodeURIComponent(decoded.charAt(j));
						else if (code <= 255) encodedValue += "%" + code.toString(16).toUpperCase();
						else encodedValue += encodeURIComponent(decoded.charAt(j));
					}
				} catch(e) {
					// INTENTO 2: Falló el decode. 
					// ¡Significa que ya era ISO-8859-1 puro de ISIS! (Ej: F5 o link interno)
					// Lo dejamos exactamente como está, sin tocar un solo caracter.
					encodedValue = val;
				}
				
				isoParams.push(key + "=" + encodedValue);
			}
			
			const wxisUrl = '/cgi-bin/wxis/wxis.exe?' + isoParams.join("&");
			
			// 1. Guardamos la búsqueda original moderna para que el botón "Compartir" siga funcionando
			window.currentSearchQuery = rawSearch;
			
			// 2. Cargamos el iframe
			setTimeout(() => {
				const title = document.getElementById('modal-resultados-titulo');
				const loaderText = document.getElementById('modal-resultados-loader-text');
				
				if (rawSearch.includes('diccionarios.xis')) {
					if (title) title.innerHTML = '<i class="fas fa-book"></i> Diccionarios Técnicos';
					if (loaderText) loaderText.textContent = 'Buscando...';
				} else {
					if (title) title.innerHTML = '<i class="fas fa-search-plus"></i> Catálogo';
					if (loaderText) loaderText.textContent = 'Buscando en el Catálogo...';
				}
				
				const resultsModal = document.getElementById('results-modal');
				const loadingIndicator = document.getElementById('loading-indicator');
				const resultsFrame = document.getElementById('resultsFrame');
				
				resultsModal.style.display = 'flex';
				loadingIndicator.style.display = 'flex';
				resultsFrame.style.opacity = '0.3';
				
				// ---> SOLUCIÓN PANTALLA BLANCA APLICADA ACÁ <---
				if (resultsFrame.contentWindow) {
					resultsFrame.contentWindow.location.replace(wxisUrl);
				} else {
					resultsFrame.src = wxisUrl;
				}
				
				bloquearScroll();
			}, 300);
		}
	});

	// =========================================
	// LÓGICA DE LA SECCIÓN AYUDA (Con Separadores Dinámicos)
	// =========================================

	function animarContenedorAyuda(callback) {
		let container = document.getElementById('ayuda-lista-acordeones');
		
		// Medición con precisión decimal para evitar el salto de sub-píxeles
		let startHeight = container.getBoundingClientRect().height;
		
		container.style.height = startHeight + 'px';
		container.style.overflow = 'hidden';
		
		callback();
		
		container.style.height = 'auto';
		let targetHeight = container.getBoundingClientRect().height;
		
		container.style.height = startHeight + 'px';
		container.offsetHeight; // Forzamos reflow del navegador
		
		container.style.transition = 'height 0.4s ease';
		container.style.height = targetHeight + 'px';
		
		setTimeout(() => {
			container.style.transition = '';
			container.style.height = 'auto';
			container.style.overflow = 'visible';
		}, 400);
	}

	function filtrarAyuda() {
		let input = document.getElementById('ayudaSearch').value.toLowerCase();
		let items = document.querySelectorAll('#ayuda-lista-acordeones .ayuda-card-acordeon');
		let separadores = document.querySelectorAll('.ayuda-separador');
		let hasResults = false;
		let isSearching = input.length > 0;

		if (isSearching) {
			document.querySelectorAll('.ayuda-chip-rect').forEach(c => c.classList.remove('active'));
			document.querySelector('.ayuda-chip-rect').classList.add('active'); 
		}

		animarContenedorAyuda(() => {
			// Oculta los separadores si el usuario está buscando algo
			separadores.forEach(sep => {
				sep.style.display = isSearching ? 'none' : 'flex';
			});

			items.forEach(item => {
				let text = item.innerText.toLowerCase();
				let keywords = item.getAttribute('data-keywords').toLowerCase();
				
				if (text.includes(input) || keywords.includes(input)) {
					item.style.display = 'block';
					hasResults = true;
				} else {
					item.style.display = 'none';
					item.classList.remove('open');
				}
			});

			let noResults = document.getElementById('ayuda-no-results');
			if (hasResults) {
				noResults.classList.add('hidden');
				noResults.style.display = 'none';
			} else {
				noResults.classList.remove('hidden');
				noResults.style.display = 'block';
			}
		});
	}

	function filtrarCategoria(categoria, elemento) {
		if (elemento.classList.contains('active')) return;

		document.getElementById('ayudaSearch').value = '';
		
		document.querySelectorAll('.ayuda-chip-rect').forEach(c => c.classList.remove('active'));
		elemento.classList.add('active');

		let items = document.querySelectorAll('#ayuda-lista-acordeones .ayuda-card-acordeon');
		let separadores = document.querySelectorAll('.ayuda-separador');
		let isTodas = (categoria === 'todas');
		
		animarContenedorAyuda(() => {
			// Muestra separadores SOLO en la vista "todas"
			separadores.forEach(sep => {
				sep.style.display = isTodas ? 'flex' : 'none';
			});

			items.forEach(item => {
				item.classList.remove('open'); 
				
				if (isTodas || item.getAttribute('data-categoria') === categoria) {
					item.style.display = 'block';
				} else {
					item.style.display = 'none';
				}
			});

			let noResults = document.getElementById('ayuda-no-results');
			noResults.classList.add('hidden');
			noResults.style.display = 'none';
		});
	}
	
	// =========================================
	// BUSCADOR PREDICTIVO (CON JSON EXTERNO)
	// =========================================
		
	// Función normalizadora — va ANTES de let tesauroINTI
	function normalizar(str) {
		return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	}

	let tesauroINTI = [];

	document.addEventListener('DOMContentLoaded', () => {

		fetch('/prueba/sugerencias.json')
			.then(r => {
				if (!r.ok) throw new Error('Error al cargar sugerencias.json: ' + r.status);
				return r.json();
			})
			.then(data => {
				if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
					// SEGURIDAD: Limitar la cantidad de términos para prevenir ataques de memoria
					tesauroINTI = data.slice(0, 50000);
					console.log("Tesauro cargado con éxito. Términos:", tesauroINTI.length);
				} else {
					console.error("El formato del tesauro no es válido.");
				}
			})
			.catch(error => console.error("No se pudo cargar el tesauro:", error));

		// Función reutilizable que conecta un input con su lista de sugerencias
		function activarSugerencias(input, lista) {
			if (!input || !lista) return;

			let indiceActivo = -1; // -1 = ningún ítem seleccionado

			function marcarActivo(items) {
				items.forEach((item, i) => {
					item.classList.toggle('sugerencia-activa', i === indiceActivo);
				});
			}

			input.addEventListener('input', function() {
			const valor = normalizar(this.value.slice(0, 100));
				lista.innerHTML = '';
				indiceActivo = -1;

				if (!valor) {
					lista.style.display = 'none';
					return;
				}

				const resultados = tesauroINTI
					.filter(termino => normalizar(termino).includes(valor))
					.slice(0, 10);

				if (resultados.length > 0) {
					resultados.forEach(termino => {
						const li = document.createElement('li');
						const terminoNorm = normalizar(termino);
						const idx = terminoNorm.indexOf(valor);
						if (idx !== -1) {
							const antes = document.createTextNode(termino.slice(0, idx));
							const negrita = document.createElement('strong');
							negrita.textContent = termino.slice(idx, idx + valor.length);
							const despues = document.createTextNode(termino.slice(idx + valor.length));
							li.appendChild(antes);
							li.appendChild(negrita);
							li.appendChild(despues);
						} else {
							li.textContent = termino;
						}
						li.addEventListener('click', () => {
							input.value = termino;
							lista.style.display = 'none';
							indiceActivo = -1;
							input.focus();
						});
						lista.appendChild(li);
					});
					lista.style.display = 'block';
				} else {
					lista.style.display = 'none';
				}
			});

			input.addEventListener('keydown', function(e) {
				const items = Array.from(lista.querySelectorAll('li'));
				if (!items.length || lista.style.display === 'none') return;

				if (e.key === 'ArrowDown') {
					e.preventDefault(); // evita que el cursor salte al final del input
					indiceActivo = (indiceActivo + 1) % items.length;
					marcarActivo(items);
					items[indiceActivo].scrollIntoView({ block: 'nearest' });

				} else if (e.key === 'ArrowUp') {
					e.preventDefault(); // evita que el cursor salte al inicio del input
					indiceActivo = (indiceActivo - 1 + items.length) % items.length;
					marcarActivo(items);
					items[indiceActivo].scrollIntoView({ block: 'nearest' });

				} else if (e.key === 'Enter') {
					if (indiceActivo >= 0) {
						e.preventDefault(); // evita que el form se envíe al elegir con Enter
						input.value = items[indiceActivo].textContent;
						lista.style.display = 'none';
						indiceActivo = -1;
					}
					// Si indiceActivo es -1 (nada seleccionado), el Enter envía el form normalmente

				} else if (e.key === 'Escape') {
					lista.style.display = 'none';
					indiceActivo = -1;

				} else if (e.key === 'Tab') {
					// Tab cierra la lista sin seleccionar nada, dejando foco libre
					lista.style.display = 'none';
					indiceActivo = -1;
				}
			});

			document.addEventListener('click', function(event) {
				if (!input.contains(event.target) && !lista.contains(event.target)) {
					lista.style.display = 'none';
					indiceActivo = -1;
				}
			});
		}

		// --- BUSCADOR SIMPLE ---
		activarSugerencias(
			document.getElementById('input-busqueda-simple'),
			document.getElementById('sugerencias-tesauro')
		);

		// --- BUSCADOR AVANZADO (PALABRAS CLAVE) ---
		activarSugerencias(
			document.getElementById('input-tema'),
			document.getElementById('sugerencias-tesauro-tema')
		);

	});
	
	// =========================================
	// MIGAS DE PAN DINÁMICAS EN EL MODAL DE FUENTES
	// =========================================
	function construirBreadcrumb(elementoOrigen) {
		const modalBreadcrumb = document.getElementById('fuentes-modal-breadcrumb');
		if (!modalBreadcrumb) return;

		if (!elementoOrigen) {
			modalBreadcrumb.innerHTML = '';
			return;
		}

		let path = [];
		let nodo = elementoOrigen;

		while (nodo) {
			if (nodo.classList && nodo.classList.contains('fuentes-menu-container')) break;

			if (nodo.classList && nodo.classList.contains('fuentes-menu-option')) {
				const textoEl = nodo.querySelector(':scope > .fuentes-option-content .fuentes-option-text');
				if (textoEl) {
					const textoLimpio = Array.from(textoEl.childNodes)
						.filter(n => n.nodeType === Node.TEXT_NODE)
						.map(n => n.textContent.trim())
						.join('') || textoEl.textContent.trim();

					if (textoLimpio) path.unshift(textoLimpio);
				}
			}
			nodo = nodo.parentElement;
		}

		if (path.length === 0) {
			modalBreadcrumb.innerHTML = '';
			return;
		}

		let html = `<span class="mb-item"><i class="fas fa-globe" aria-hidden="true"></i> Guía de Fuentes <i class="fas fa-chevron-right mb-separator" aria-hidden="true"></i></span>`;

		html += path.map((item, index) => {
			if (index === path.length - 1) {
				return `<span class="mb-item"><span class="mb-current">${item}</span></span>`;
			}
			return `<span class="mb-item"><span>${item}</span> <i class="fas fa-chevron-right mb-separator" aria-hidden="true"></i></span>`;
		}).join('');

		modalBreadcrumb.innerHTML = html;
	}

	// =========================================
	// MIS BÚSQUEDAS GUARDADAS
	// =========================================
	const STORAGE_KEY = 'biblioteca_inti_busquedas';

	function obtenerBusquedas() {
		try {
			return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
		} catch {
			return [];
		}
	}

	function guardarEnStorage(lista) {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
		actualizarContador();
	}

	function actualizarContador() {
		const lista = obtenerBusquedas();
		const contador = document.getElementById('contador-busquedas');
		if (!contador) return;
		if (lista.length > 0) {
			contador.textContent = lista.length;
			contador.style.display = 'inline';
		} else {
			contador.style.display = 'none';
		}
	}

	// Función auxiliar para leer caracteres ISO-8859-1 (el formato de ISIS)
	function decodificarParametroISIS(query, param) {
		const regex = new RegExp('(?:^|&)' + param + '=([^&]*)', 'i');
		const match = query.match(regex);
		if (match && match[1]) {
			let valor = match[1].replace(/\+/g, ' '); // Cambia los + de la URL por espacios
			try {
				// Intenta decodificar como UTF-8 moderno (por si acaso)
				return decodeURIComponent(valor);
			} catch (e) {
				// Si falla, es porque está en ISO-8859-1 puro. Lo decodificamos carácter por caracter:
				return valor.replace(/%([0-9A-F]{2})/gi, function(m, hex) {
					return String.fromCharCode(parseInt(hex, 16));
				});
			}
		}
		return null;
	}

function guardarBusquedaActual() {
		const query = window.currentSearchQuery;
		if (!query) return;

		const lista = obtenerBusquedas();

		if (lista.some(b => queriesCoinciden(b.query, query))) {
			mostrarToast('Esta búsqueda ya está guardada');
			return;
		}

		let tituloFinal = "";
		let tituloIframe = "";

		// ---> 1. LA SOLUCIÓN DIRECTA Y SEGURA
		try {
			const iframe = document.getElementById('resultsFrame');
			const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
			
			// VERIFICACIÓN CRUCIAL: Buscamos la bandera invisible inyectada en el HTML del registro único
			const esRegistroUnico = iframeDoc.getElementById('flag-registro-unico');
			
			if (esRegistroUnico) {
				// Solo si estamos en un registro único, robamos el título
				const tituloEl = iframeDoc.querySelector('.titulo-destacado');
				if (tituloEl) {
					tituloIframe = (tituloEl.textContent || tituloEl.innerText).replace(/\s+/g, " ").trim();
				}
			}
		} catch (e) {
			console.log("No se pudo leer el iframe", e);
		}

		// ---> 2. PRIORIDAD MÁXIMA: Si es un registro único y robamos el título
		if (tituloIframe) {
			let tituloCorto = tituloIframe.length > 65 
				? tituloIframe.substring(0, 65) + "..." 
				: tituloIframe;
			
			tituloFinal = `"${tituloCorto}"`;
		} 
		else {
			// ---> 3. GENERADOR DE TÍTULOS COMBINADOS (Para Simple y Avanzada)
			
			// Si es una Búsqueda Simple o General (tiene busca1, expr_avanzada, etc.)
			let terminoSimple = decodificarParametroISIS(query, 'busca1') || 
							    decodificarParametroISIS(query, 'bool') || 
							    decodificarParametroISIS(query, 'expression') || 
							    decodificarParametroISIS(query, 'desc');
			
			if (terminoSimple) {
				// Es una búsqueda simple
				let terminoLimpio = terminoSimple
					.replace(/\/\([0-9]+\)/g, '')       
					.replace(/^(TI=|AU=|KW=|MH=)/i, '') 
					.replace(/\$/g, '')                 
					.replace(/[\(\)]/g, '')             
					.trim();
					
				tituloFinal = terminoLimpio ? `"${terminoLimpio}"` : '"Búsqueda"';
			
			} else {
				// Es una Búsqueda Avanzada. Armamos un array con las partes que el usuario llenó.
				let partesAvanzada = [];
				
				let valAutor = decodificarParametroISIS(query, 'autor');
				if (valAutor) partesAvanzada.push(`Autor: "${valAutor.trim()}"`);
				
				let valTitulo = decodificarParametroISIS(query, 'titulo');
				if (valTitulo) partesAvanzada.push(`Título: "${valTitulo.trim()}"`);
				
				let valTema = decodificarParametroISIS(query, 'tema');
				if (valTema) partesAvanzada.push(`Tema: "${valTema.trim()}"`);
				
				let valAnio = decodificarParametroISIS(query, 'anio');
				if (valAnio) partesAvanzada.push(`Año: "${valAnio.trim()}"`);
				
				let valIdioma = decodificarParametroISIS(query, 'idioma');
				if (valIdioma) partesAvanzada.push(`Idioma: "${valIdioma.trim()}"`);
				
				let valISSN = decodificarParametroISIS(query, 'issn');
				if (valISSN) partesAvanzada.push(`ISSN/ISBN: "${valISSN.trim()}"`);
				
				let valFiltroInti = decodificarParametroISIS(query, 'filtro_inti');
				if (valFiltroInti) partesAvanzada.push(`Producción INTI`);
				
				let valTipoDoc = decodificarParametroISIS(query, 'tipo_doc');
				if (valTipoDoc) partesAvanzada.push(`Formato: "${valTipoDoc.trim()}"`);

				// Si encontramos algún campo de la avanzada lleno, los unimos con " | "
				if (partesAvanzada.length > 0) {
					// FIX: Comillas simples para no interferir con el renderizador de cursivas
					tituloFinal = partesAvanzada.join(" | ");
				} else {
					// Lógica combinada diccionarios (Fallback)
					let t1 = decodificarParametroISIS(query, 'tag1');
					if (t1) {
						tituloFinal = `"${t1.trim()}"`; 
						
						let t3 = decodificarParametroISIS(query, 'tag3');
						if (t3) {
							let op1 = decodificarParametroISIS(query, 'tag2') || 'and';
							let textoOp1 = op1 === 'or' ? ' O ' : (op1 === 'not' ? ' SIN ' : ' Y ');
							tituloFinal += `${textoOp1}"${t3.trim()}"`;
						}
						
						let t5 = decodificarParametroISIS(query, 'tag5');
						if (t5) {
							let op2 = decodificarParametroISIS(query, 'tag4') || 'and';
							let textoOp2 = op2 === 'or' ? ' O ' : (op2 === 'not' ? ' SIN ' : ' Y ');
							tituloFinal += `${textoOp2}"${t5.trim()}"`;
						}
					}
				}
			}
		}

		if(tituloFinal === '""' || tituloFinal === '') tituloFinal = '"Búsqueda"';

		// ---> 4. AVERIGUAMOS LA BASE DE DATOS
		let baseBruta = decodificarParametroISIS(query, 'base') || decodificarParametroISIS(query, 'tag9') || '';
		
		const baseNombres = { 
			'inti': 'Libros + Normas', 
			'cat': 'Libros', 
			'kardex': 'Revistas', 
			'norma': 'Normas',
			'fueint': 'Guía de Fuentes',
			'/isis/cobre/cobre': 'Dic. Cobre',    
			'/isis/caucho/caucho': 'Dic. Caucho', 
			'/isis/nodest/nodest': 'Dic. E.N.D.'  
		};
		
		const baseTexto = baseNombres[baseBruta] || baseBruta;
		
		// Si robamos un título exitosamente del iframe, usamos "de"
		const preposicion = tituloIframe ? 'de' : 'en';
		
		const titulo = baseTexto ? `${tituloFinal} ${preposicion} ${baseTexto}` : tituloFinal;

		const nueva = {
			id: Date.now(),
			titulo: titulo,
			query: query,
			fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
		};

		lista.unshift(nueva); 
		guardarEnStorage(lista);

		const btn = document.getElementById('btn-guardar-actual');
		if (btn) {
			btn.classList.add('ya-guardada');
			btn.innerHTML = '<i class="fas fa-check"></i> Guardada';
		}

		mostrarToast('Búsqueda guardada correctamente');
	}

	function relanzarBusqueda(query) {
		toggleMisBusquedas(); // Cierra el modal

		const urlConParams = window.location.pathname + '?' + query + '#resultados';
		window.history.replaceState(null, '', urlConParams);

		const resultsModal = document.getElementById('results-modal');
		const loadingIndicator = document.getElementById('loading-indicator');
		const resultsFrame = document.getElementById('resultsFrame');
		const title = document.getElementById('modal-resultados-titulo');

		if (title) title.innerHTML = '<i class="fas fa-search-plus"></i> Catálogo';
		resultsModal.style.display = 'flex';
		loadingIndicator.style.display = 'flex';
		resultsFrame.style.opacity = '0.3';
		
		// ---> SOLUCIÓN PANTALLA BLANCA <---
		const urlRelanzar = '/cgi-bin/wxis/wxis.exe?' + query;
		if (resultsFrame.contentWindow) {
			resultsFrame.contentWindow.location.replace(urlRelanzar);
		} else {
			resultsFrame.src = urlRelanzar;
		}
		
		window.currentSearchQuery = query;
		bloquearScroll();
	}

	function copiarEnlaceBusqueda_guardada(query) {
		const urlCompartir = window.location.origin + window.location.pathname + '?' + query + '#resultados';
		
		// Intento 1: API Moderna
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(urlCompartir).then(() => {
				mostrarToast('Enlace copiado al portapapeles');
			}).catch(() => fallbackCopiar(urlCompartir));
		} else {
			// Intento 2: Plan B (Textarea invisible)
			fallbackCopiar(urlCompartir);
		}
	}

	// Función auxiliar para no repetir código
	function fallbackCopiar(texto) {
		let textArea = document.createElement("textarea");
		textArea.value = texto;
		textArea.style.position = "fixed";
		textArea.style.top = "-999px";
		textArea.style.left = "-999px";
		textArea.style.opacity = "0";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			let exitoso = document.execCommand('copy');
			if (exitoso) {
				mostrarToast("Enlace copiado al portapapeles");
			} else {
				prompt("Copiá este enlace manualmente:", texto);
			}
		} catch (err) {
			prompt("Copiá este enlace manualmente:", texto);
		}
		document.body.removeChild(textArea);
	}

	function borrarBusqueda(id) {
		const lista = obtenerBusquedas().filter(b => b.id !== id);
		guardarEnStorage(lista);
		renderizarMisBusquedas();
	}

	function borrarTodasLasBusquedas() {
		if (!confirm('¿Borrar todas las búsquedas guardadas?')) return;
		guardarEnStorage([]);
		renderizarMisBusquedas();
	}

	function renderizarMisBusquedas() {
		const lista = obtenerBusquedas();
		const contenedor = document.getElementById('mis-busquedas-lista');
		if (!contenedor) return;

		if (lista.length === 0) {
			contenedor.innerHTML = `
				<div class="busquedas-vacio">
					<i class="fas fa-bookmark"></i>
					<p>No tenés búsquedas guardadas todavía.</p>
					<p style="font-size:0.85rem; margin-top:8px;">Realizá una búsqueda y presioná <strong>Guardar</strong> en la barra de resultados.</p>
				</div>`;
			return;
		}

		contenedor.innerHTML = '';

		lista.forEach(b => {
			// Escapamos todos los datos que vienen de localStorage antes de usarlos
			const tituloSeguro = escaparHTML(b.titulo);
			const fechaSegura  = escaparHTML(b.fecha);
			const idSeguro     = parseInt(b.id, 10) || 0;

			// Aplicamos la itálica DESPUÉS de escapar, sobre texto ya seguro
			const tituloEstilizado = tituloSeguro
				.replace(
					/&quot;([^&]+)&quot;/g,
					'<span style="font-style: italic; font-weight: bold; color: #212529;">"$1"</span>'
				)
				.replace(
					/ \| /g,
					' <span style="color:#adb5bd; font-weight:300;">|</span> '
				);

			// Creamos el contenedor principal del ítem como nodo DOM
			const item = document.createElement('div');
			item.className = 'busqueda-item';

			// innerHTML solo con texto ya escapado + HTML estático nuestro
			item.innerHTML = `
				<div class="busqueda-item-titulo" style="font-weight: normal; color: #6c757d; display: flex; align-items: flex-start; gap: 8px;">
					<i class="fas fa-search" style="color:var(--primary); font-size:0.9rem; margin-top: 3px; flex-shrink: 0;"></i>
					<span style="flex: 1; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.4;">
						${tituloEstilizado}
					</span>
				</div>
				<div class="busqueda-item-meta">
					<i class="fas fa-calendar-alt"></i> Guardada el ${fechaSegura}
				</div>
				<div class="busqueda-item-acciones"></div>
			`;

			// Los botones con handlers de eventos los creamos como nodos reales,
			// nunca como strings en onclick="...", para que b.query nunca toque el HTML
			const acciones = item.querySelector('.busqueda-item-acciones');

			const btnRelanzar = document.createElement('button');
			btnRelanzar.className = 'busqueda-btn-relanzar';
			btnRelanzar.innerHTML = '<i class="fas fa-play"></i> Relanzar';
			btnRelanzar.addEventListener('click', function() { relanzarBusqueda(b.query); });

			const btnCopiar = document.createElement('button');
			btnCopiar.className = 'busqueda-btn-copiar';
			btnCopiar.innerHTML = '<i class="fas fa-link"></i> Copiar enlace';
			btnCopiar.addEventListener('click', function() { copiarEnlaceBusqueda_guardada(b.query); });

			const btnBorrar = document.createElement('button');
			btnBorrar.className = 'busqueda-btn-borrar';
			btnBorrar.title = 'Eliminar esta búsqueda';
			btnBorrar.innerHTML = '<i class="fas fa-times"></i>';
			btnBorrar.addEventListener('click', function() { borrarBusqueda(idSeguro); });

			acciones.appendChild(btnRelanzar);
			acciones.appendChild(btnCopiar);
			acciones.appendChild(btnBorrar);

			contenedor.appendChild(item);
		});
	}

	function toggleMisBusquedas() {
		const modal = document.getElementById('modal-mis-busquedas');
		if (!modal) return;
		const visible = modal.style.display === 'flex';
		if (visible) {
			modal.style.display = 'none';
			desbloquearScroll();
		} else {
			renderizarMisBusquedas();
			modal.style.display = 'flex';
			bloquearScroll();
		}
	}

	// Cerrar al hacer clic fuera del contenido
	document.getElementById('modal-mis-busquedas')?.addEventListener('click', function(e) {
		if (e.target === this) toggleMisBusquedas();
	});

	// Función inteligente para comparar URLs ignorando diferencias entre "+" y "%20"
	function queriesCoinciden(q1, q2) {
		try {
			// URLSearchParams lee tanto "+" como "%20" como si fueran espacios,
			// estandarizando ambas URLs al mismo formato.
			const p1 = new URLSearchParams(q1);
			const p2 = new URLSearchParams(q2);
			p1.sort();
			p2.sort();
			return p1.toString() === p2.toString();
		} catch (e) {
			return q1 === q2; // Fallback por si acaso
		}
	}

	// Mostrar/ocultar el botón Guardar según si hay búsqueda activa
	// Se llama desde onIframeLoad() que ya existe
	function actualizarBotonGuardar() {
		const btn = document.getElementById('btn-guardar-actual');
		if (!btn) return;
		if (window.currentSearchQuery) {
			btn.style.display = 'inline-flex';
			// Resetear estado por si venía de una búsqueda ya guardada
			const lista = obtenerBusquedas();
			if (lista.some(b => queriesCoinciden(b.query, window.currentSearchQuery))) {
				btn.classList.add('ya-guardada');
				btn.innerHTML = '<i class="fas fa-check"></i> Guardada';
			} else {
				btn.classList.remove('ya-guardada');
				btn.innerHTML = '<i class="fas fa-bookmark"></i> Guardar';
			}
		} else {
			btn.style.display = 'none';
		}
	}

	// Inicializar el contador al cargar
	document.addEventListener('DOMContentLoaded', () => {
		actualizarContador();
	});
	
	// =========================================
	// CERRAR MODALES CON LA TECLA ESCAPE (EXPANDIDO)
	// =========================================
	document.addEventListener('keydown', function(event) {
		if (event.key === 'Escape') {
			
			// 1. Modal de Mis Búsquedas
			const modalBusquedas = document.getElementById('modal-mis-busquedas');
			if (modalBusquedas && modalBusquedas.style.display === 'flex') {
				toggleMisBusquedas();
			}

			// 2. Modal de Resultados del Catálogo
			const modalResultados = document.getElementById('results-modal');
			if (modalResultados && modalResultados.style.display === 'flex') {
				modalResultados.style.display = 'none';
				desbloquearScroll();
			}

			// 3. Modal de la Guía de Fuentes
			// Asumo que el ID es 'modal-fuentes' o similar. 
			// Si usás showSection('fuentes'), probamos ocultándolo directamente:
			const modalFuentes = document.getElementById('fuentes-modal');
			if (modalFuentes && modalFuentes.style.display === 'flex') {
				// Si tenés una función cerrarFuentes(), llamala acá. 
				// Si no, lo ocultamos manualmente:
				modalFuentes.style.display = 'none';
				desbloquearScroll();
			}

			// 4. Modal del Mapa de Google
			const modalMapa = document.getElementById('modal-mapa');
			if (modalMapa && modalMapa.style.display === 'flex') {
				modalMapa.style.display = 'none';
				desbloquearScroll();
			}
            
            // 5. Caso especial: Secciones (si 'fuentes' es una sección y no un modal)
            // Si al abrir fuentes usás showSection('fuentes'), quizás quieras volver al inicio:
            if (typeof currentSection !== 'undefined' && currentSection === 'fuentes') {
                showSection('home'); // O la sección principal que corresponda
            }
		}
	});