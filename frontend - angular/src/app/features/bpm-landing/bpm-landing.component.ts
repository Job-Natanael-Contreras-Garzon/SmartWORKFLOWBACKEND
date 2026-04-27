import { Component, OnInit, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bpm-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bpm-landing.component.html',
  styleUrls: ['./bpm-landing.component.css']
})
export class BpmLandingComponent implements OnInit, AfterViewInit {
  @ViewChildren('revealSection') revealSections!: QueryList<ElementRef>;
  @ViewChildren('statNumber') statNumbers!: QueryList<ElementRef>;
  
  isScrolled = false;
  isMobileMenuOpen = false;
  isAnnualPricing = true;
  isStaffView = true;
  activeUseCaseIndex = 0;
  activeTestimonialIndex = 0;

  // Data for Features
  features = [
    {
      title: 'Editor Visual de Flujos',
      description: 'Arrastra, conecta y publica políticas de negocio en minutos. Sin código.',
      icon: 'M4 6h16M4 12h16M4 18h7' // Placeholder for actual complex SVG path in template
    },
    {
      title: 'Motor BPM Inteligente',
      description: 'Flujos lineales, alternativos y paralelos. El motor mueve los trámites automáticamente.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z'
    },
    {
      title: 'Seguimiento Público en Tiempo Real',
      description: 'Tu cliente sabe exactamente dónde está su trámite, sin llamar ni hacer fila.',
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
    },
    {
      title: 'IA + Comandos de Voz',
      description: 'Diseña diagramas hablando. La IA entiende, dibuja y sugiere.',
      icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
    },
    {
      title: 'Detección de Cuellos de Botella',
      description: 'La IA identifica qué departamento está frenando el sistema y recomienda acciones.',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: '100% Colaborativo',
      description: 'Múltiples usuarios editando el mismo flujo en tiempo real, como Figma para tus procesos.',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    }
  ];

  // Data for Use Cases
  useCases = [
    {
      industry: '🏢 Empresas de Servicios',
      flowName: 'Instalaciones y Reclamos',
      steps: 8,
      departments: 4,
      timeBefore: '15 días',
      timeAfter: '4 días'
    },
    {
      industry: '🏦 Servicios Financieros',
      flowName: 'Aprobación de Créditos',
      steps: 12,
      departments: 5,
      timeBefore: '21 días',
      timeAfter: '5 días'
    },
    {
      industry: '🏥 Salud',
      flowName: 'Admisiones y Autorizaciones',
      steps: 5,
      departments: 3,
      timeBefore: '4 horas',
      timeAfter: '15 minutos'
    },
    {
      industry: '🏛️ Gobierno Local',
      flowName: 'Permisos de Construcción',
      steps: 15,
      departments: 6,
      timeBefore: '45 días',
      timeAfter: '12 días'
    }
  ];

  // Data for Testimonials
  testimonials = [
    {
      quote: "Desde que implementamos FlowDesk, eliminamos el 90% de los correos internos para preguntar '¿dónde está mi trámite?'. La visibilidad es total y la IA nos ayudó a rediseñar nuestro proceso de instalaciones en días en lugar de meses.",
      name: "Carlos Rivera",
      role: "Director de Operaciones",
      company: "Empresa de Distribución de Gas (Bolivia)",
      initials: "CR"
    },
    {
      quote: "El editor visual es tan intuitivo que nuestros gerentes de área ahora diseñan sus propios flujos de aprobación. La reducción de cuellos de botella en la apertura de cuentas corporativas ha sido un cambio radical para nuestro negocio.",
      name: "Andrea Salazar",
      role: "Jefa de Sistemas",
      company: "Banco Regional (Colombia)",
      initials: "AS"
    },
    {
      quote: "Los pacientes solían esperar horas para autorizaciones médicas. Con el portal de seguimiento público de FlowDesk, ellos ven el estado desde su teléfono y nosotros gestionamos todo automáticamente entre áreas.",
      name: "Mariana Rojas",
      role: "Coordinadora de Calidad",
      company: "Clínica Privada (Perú)",
      initials: "MR"
    }
  ];

  constructor() {}

  ngOnInit(): void {
    window.addEventListener('scroll', () => {
      this.isScrolled = window.scrollY > 50;
    });

    // Auto-advance testimonials
    setInterval(() => {
      this.nextTestimonial();
    }, 5000);
    
    // Check initial theme from document
    if (document.documentElement.classList.contains('dark')) {
      this.isDarkMode = true;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // document.documentElement.classList.add('dark');
      // this.isDarkMode = true;
      // We don't force it if the app didn't, but we can track it
    }
  }
  
  isDarkMode = false;
  
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          
          // If it's a stats container, animate numbers
          if (entry.target.classList.contains('stats-container')) {
            this.animateStats();
          }
          
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    this.revealSections.forEach(section => {
      observer.observe(section.nativeElement);
    });
  }

  animateStats(): void {
    this.statNumbers.forEach(statRef => {
      const el = statRef.nativeElement;
      const finalValueStr = el.getAttribute('data-value');
      
      // Basic number extraction for animation
      const finalValue = parseFloat(finalValueStr.replace(/[^0-9.]/g, ''));
      if (isNaN(finalValue)) return;
      
      let startValue = 0;
      const duration = 2000; // ms
      const startTime = performance.now();
      
      const updateNumber = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function (easeOutQuart)
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentValue = (easeProgress * finalValue);
        
        // Formatting back (e.g. 3.2x, 94%)
        let displayValue = '';
        if (finalValueStr.includes('.')) {
          displayValue = currentValue.toFixed(1);
        } else {
          displayValue = Math.floor(currentValue).toString();
        }
        
        if (finalValueStr.includes('x')) displayValue += 'x';
        if (finalValueStr.includes('%')) displayValue += '%';
        if (finalValueStr.includes('h')) displayValue += 'h';
        if (finalValueStr.includes('<')) displayValue = '< ' + displayValue;
        if (finalValueStr.includes('+')) displayValue = '+' + displayValue;
        
        el.innerText = displayValue;
        
        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          el.innerText = finalValueStr; // Ensure final string matches exactly
        }
      };
      
      requestAnimationFrame(updateNumber);
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  togglePricing(): void {
    this.isAnnualPricing = !this.isAnnualPricing;
  }

  toggleViewMode(): void {
    this.isStaffView = !this.isStaffView;
  }

  setUseCase(index: number): void {
    this.activeUseCaseIndex = index;
  }

  setTestimonial(index: number): void {
    this.activeTestimonialIndex = index;
  }

  nextTestimonial(): void {
    this.activeTestimonialIndex = (this.activeTestimonialIndex + 1) % this.testimonials.length;
  }
}
