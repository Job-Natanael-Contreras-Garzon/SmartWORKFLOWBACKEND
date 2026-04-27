import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Graph, Shape } from '@antv/x6';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Export } from '@antv/x6-plugin-export';
import { History } from '@antv/x6-plugin-history';
import { PolicyService, Policy } from '../../core/api/policy.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-policy-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './policy-editor.component.html',
  styles: [`
    :host { display: block; height: 100vh; background: #12131a; color: #e3e1eb; overflow: hidden; }
    .x6-graph-scroller { background: #12131a !important; }
    .canvas-grid { background-image: radial-gradient(#444653 1px, transparent 1px); background-size: 20px 20px; }
  `]
})
export class PolicyEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dndContainer') dndContainer!: ElementRef<HTMLElement>;

  private policyService = inject(PolicyService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  private graph!: Graph;
  private dnd!: Dnd;

  saveStatus = signal<'Guardado' | 'Guardando...' | 'Error'>('Guardado');
  canUndo = signal(false);
  canRedo = signal(false);

  selectedNode: any = null;
  nodeType: string = '';
  nodeData: any = {};
  validationErrors: {id: string, message: string}[] = [];

  currentPolicyId = signal<string | null>(null);

  ngAfterViewInit() {
    this.initGraph();
    this.initPlugins();
    this.registerCustomNodes();
    this.initDnd();
    this.initEvents();
  }

  ngOnDestroy() {
    if (this.graph) this.graph.dispose();
  }

  private initGraph() {
    this.graph = new Graph({
      container: this.graphContainer.nativeElement,
      autoResize: true,
      background: { color: 'transparent' },
      grid: false,
      panning: { enabled: true, eventTypes: ['leftMouseDown', 'mouseWheel'] },
      mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'], minScale: 0.1, maxScale: 4 },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        connector: 'polyline',
        connectionPoint: 'boundary',
        router: { name: 'manhattan' },
        createEdge() {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: '#8e909f',
                strokeWidth: 2,
                targetMarker: { name: 'classic', size: 8 },
              },
            },
            labels: [{ attrs: { label: { text: '', fill: '#e3e1eb' } } }],
            tools: ['edge-editor', 'button-remove']
          });
        },
        validateConnection({ targetMagnet }) { return !!targetMagnet; },
      },
    });
  }

  private initPlugins() {
    this.graph.use(new Keyboard({ enabled: true, global: true }));
    this.graph.bindKey(['backspace', 'delete'], () => {
      const cells = this.graph.getSelectedCells();
      if (cells.length) this.graph.removeCells(cells);
    });

    this.graph.use(new Selection({
      enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true,
    }));

    this.graph.use(new Snapline({ enabled: true, sharp: true }));
    this.graph.use(new Export());
    this.graph.use(new History({ enabled: true }));

    this.graph.on('history:change', () => {
      this.canUndo.set(this.graph.canUndo());
      this.canRedo.set(this.graph.canRedo());
    });
  }

  private initEvents() {
    this.graph.on('selection:changed', ({ selected }) => {
      if (selected.length === 1 && selected[0].isNode()) {
        this.selectedNode = selected[0];
        this.nodeType = this.selectedNode.shape;
        const data = this.selectedNode.getData() || {};

        if (this.nodeType === 'uml-task') {
          this.nodeData = {
            name: this.selectedNode.attr('label/text') || 'Nueva Tarea',
            description: data.description || '',
            department: data.department || '',
            sla: data.sla || 0,
            formId: data.formId || ''
          };
        }
      } else {
        this.selectedNode = null;
        this.nodeType = '';
      }
    });

    this.graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools(['source-arrowhead', 'target-arrowhead', { name: 'button-remove', args: { distance: -30 } }]);
    });
    this.graph.on('edge:mouseleave', ({ edge }) => edge.removeTools());
  }

  updateVisuals() {
    if (this.selectedNode && this.nodeType === 'uml-task') {
      this.selectedNode.attr('label/text', this.nodeData.name);
      this.updateNodeData();
    }
  }

  updateNodeData() {
    if (this.selectedNode) {
      this.selectedNode.setData({ ...this.nodeData }, { overwrite: true });
    }
  }

  undo() { if (this.graph.canUndo()) this.graph.undo(); }
  redo() { if (this.graph.canRedo()) this.graph.redo(); }

  saveToBackend() {
    this.saveStatus.set('Guardando...');
    const diagram = JSON.stringify(this.graph.toJSON());
    
    const policyData: Partial<Policy> = {
      name: 'Nueva Política', // Podría pedirse al usuario
      description: 'Diagrama de flujo de proceso',
      diagramData: diagram,
      isActive: true
    };

    if (this.currentPolicyId()) {
      this.policyService.updatePolicy(this.currentPolicyId()!, policyData).subscribe({
        next: (res: Policy) => {
          this.saveStatus.set('Guardado');
          this.toastr.success('Progreso guardado correctamente');
        },
        error: () => {
          this.saveStatus.set('Error');
          this.toastr.error('Error al guardar en el servidor');
        }
      });
    } else {
      this.policyService.createPolicy(policyData as Policy).subscribe({
        next: (res: Policy) => {
          this.currentPolicyId.set(res.id);
          this.saveStatus.set('Guardado');
          this.toastr.success('Política creada y guardada');
        },
        error: () => {
          this.saveStatus.set('Error');
          this.toastr.error('Error al crear la política');
        }
      });
    }
  }

  validateGraph() {
    this.validationErrors = [];
    const nodes = this.graph.getNodes();
    let hasStart = false;
    let hasEnd = false;

    nodes.forEach(n => {
      if (n.shape === 'uml-start') hasStart = true;
      if (n.shape === 'uml-end') hasEnd = true;
      if (n.shape === 'uml-task') {
        const data = n.getData() || {};
        if (!data.department) {
          this.validationErrors.push({ id: n.id, message: `Falta departamento en "${n.attr('label/text')}"` });
        }
      }
    });

    if (!hasStart) this.validationErrors.push({ id: 'none', message: 'Falta Evento de Inicio' });
    if (!hasEnd) this.validationErrors.push({ id: 'none', message: 'Falta Evento de Fin' });

    if (this.validationErrors.length === 0) {
      this.toastr.success('Validación exitosa');
    }
  }

  private registerCustomNodes() {
    const portAttrs = {
      circle: {
        r: 4, magnet: true, stroke: '#1e40af', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' },
      },
    };

    const portsList = {
      groups: {
        top: { position: 'top', attrs: portAttrs },
        right: { position: 'right', attrs: portAttrs },
        bottom: { position: 'bottom', attrs: portAttrs },
        left: { position: 'left', attrs: portAttrs },
      },
      items: [{ group: 'top' }, { group: 'right' }, { group: 'bottom' }, { group: 'left' }],
    };

    Graph.registerNode('uml-start', {
      inherit: 'circle', width: 40, height: 40,
      attrs: { body: { fill: '#15803d', stroke: '#4ade80', strokeWidth: 2 } },
      ports: { ...portsList }
    });

    Graph.registerNode('uml-task', {
      inherit: 'rect', width: 120, height: 60,
      attrs: { 
        body: { rx: 8, ry: 8, fill: '#1e1f26', stroke: '#1e40af', strokeWidth: 2 },
        label: { text: 'Nueva Tarea', fill: '#e3e1eb', fontSize: 12, fontWeight: 'bold' }
      },
      ports: { ...portsList }
    });

    Graph.registerNode('uml-gateway-xor', {
      inherit: 'polygon', width: 50, height: 50,
      attrs: { 
        body: { points: '25,0 50,25 25,50 0,25', fill: '#1e1f26', stroke: '#b45309', strokeWidth: 2 },
        label: { text: 'X', fontSize: 16, fill: '#ffb59a', fontWeight: 'bold' }
      },
      ports: { ...portsList }
    });

    Graph.registerNode('uml-end', {
      inherit: 'circle', width: 40, height: 40,
      attrs: { body: { fill: '#991b1b', stroke: '#ffb4ab', strokeWidth: 4 } },
      ports: { ...portsList }
    });
  }

  private initDnd() {
    this.dnd = new Dnd({ target: this.graph, scaled: false, dndContainer: this.dndContainer.nativeElement });
  }

  startDrag(e: MouseEvent, type: string) {
    let node;
    switch (type) {
      case 'start': node = this.graph.createNode({ shape: 'uml-start' }); break;
      case 'task': node = this.graph.createNode({ shape: 'uml-task' }); break;
      case 'gateway-xor': node = this.graph.createNode({ shape: 'uml-gateway-xor' }); break;
      case 'end': node = this.graph.createNode({ shape: 'uml-end' }); break;
    }
    if (node) this.dnd.start(node, e);
  }

  clearValidation() { this.validationErrors = []; }
  
  forcePublish() {
    if (confirm('¿Publicar con errores?')) {
      this.saveToBackend();
    }
  }
}
