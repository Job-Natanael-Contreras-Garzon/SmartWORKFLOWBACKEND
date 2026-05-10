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

  selectedNode = signal<any>(null);
  nodeType = '';
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
                targetMarker: { name: 'block', size: 10, fill: '#8e909f' },
              },
            },
            labels: [{ attrs: { label: { text: '', fill: '#e3e1eb', fontSize: 11 } } }],
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
      // Remove tools from previously selected node if any
      const prev = this.selectedNode();
      if (prev && prev.isNode()) prev.removeTools();

      if (selected.length === 1) {
        const cell = selected[0];
        this.selectedNode.set(cell);
        this.nodeType = cell.shape;
        const data = cell.getData() || {};

        if (cell.isNode()) {
          // Add remove tool to the selected node
          cell.addTools(['button-remove']);

          if (this.nodeType === 'uml-task') {
            this.nodeData = {
              name: cell.attr('label/text') || 'Nueva Tarea',
              description: data.description || '',
              department: data.department || '',
              sla: data.sla || 0,
              formId: data.formId || ''
            };
          } else {
            this.nodeData = { ...data };
          }
        } else if (cell.isEdge()) {
          this.nodeType = 'edge';
          this.nodeData = {
            conditionExpression: data.conditionExpression || cell.labels?.[0]?.attrs?.['label']?.['text'] || '',
            lineStyle: data.lineStyle || 'solid',
            strokeColor: cell.attr('line/stroke') || '#8e909f'
          };
        }
      } else {
        this.selectedNode.set(null);
        this.nodeType = '';
      }
    });

    this.graph.on('node:mouseenter', ({ node }) => {
      node.addTools(['button-remove']);
      const ports = node.getPorts();
      ports.forEach(port => {
        node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'visible');
      });
    });

    this.graph.on('node:mouseleave', ({ node }) => {
      if (this.selectedNode() !== node) {
        node.removeTools();
        const ports = node.getPorts();
        ports.forEach(port => {
          node.setPortProp(port.id!, 'attrs/circle/style/visibility', 'hidden');
        });
      }
    });

    this.graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools(['source-arrowhead', 'target-arrowhead', { name: 'button-remove', args: { distance: -30 } }]);
    });
    this.graph.on('edge:mouseleave', ({ edge }) => edge.removeTools());
  }

  updateNodeData() {
    const node = this.selectedNode();
    if (node) {
      node.setData({ ...this.nodeData }, { overwrite: true });
    }
  }

  updateVisuals() {
    const node = this.selectedNode();
    if (node) {
      if (node.isNode()) {
        node.attr('label/text', this.nodeData.name);
      } else if (node.isEdge()) {
        node.setLabels([{ attrs: { label: { text: this.nodeData.conditionExpression } } }]);
        const dashArray = this.nodeData.lineStyle === 'dashed' ? '5,5' : 
                         this.nodeData.lineStyle === 'dotted' ? '2,2' : '';
        node.attr('line/strokeDasharray', dashArray);
        node.attr('line/stroke', this.nodeData.strokeColor);
      }
      this.updateNodeData();
    }
  }

  undo() { if (this.graph.canUndo()) this.graph.undo(); }
  redo() { if (this.graph.canRedo()) this.graph.redo(); }

  saveToBackend() {
    if (!this.currentPolicyId()) {
      this.toastr.warning('Por favor, crea una política primero o selecciona una existente.');
      return;
    }

    this.saveStatus.set('Guardando...');
    const diagramPayload = this.transformToBackendFormat();
    
    // Guardamos el diagrama específico
    this.policyService.saveDiagram(this.currentPolicyId()!, diagramPayload).subscribe({
      next: () => {
        // También guardamos el estado del canvas para poder recuperarlo (opcional, si el backend lo permite)
        const canvasState = {
          diagramData: JSON.stringify(this.graph.toJSON())
        };
        this.policyService.updatePolicy(this.currentPolicyId()!, canvasState).subscribe();

        this.saveStatus.set('Guardado');
        this.toastr.success('Diagrama guardado correctamente');
      },
      error: () => {
        this.saveStatus.set('Error');
        this.toastr.error('Error al guardar el diagrama');
      }
    });
  }

  validateGraph() {
    if (!this.currentPolicyId()) return;

    this.validationErrors = [];
    this.policyService.validatePolicy(this.currentPolicyId()!).subscribe({
      next: (res) => {
        if (res.valid) {
          this.toastr.success('Estructura del proceso válida');
        } else {
          this.validationErrors = res.errors || [{ message: 'Error de validación desconocido' }];
          this.toastr.error('El diagrama tiene errores de estructura');
        }
      },
      error: (err) => {
        this.toastr.error('Error al conectar con el servicio de validación');
      }
    });
  }

  publishPolicy() {
    if (!this.currentPolicyId()) return;
    
    if (!confirm('¿Estás seguro de publicar esta política? Una vez activa, se podrá usar para crear casos.')) return;

    this.policyService.publishPolicy(this.currentPolicyId()!).subscribe({
      next: () => {
        this.toastr.success('Política publicada exitosamente');
      },
      error: () => this.toastr.error('Error al publicar la política. Verifica que sea válida.')
    });
  }

  private registerCustomNodes() {
    const portAttrs = {
      circle: {
        r: 5, magnet: true, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e1f26', style: { visibility: 'hidden' },
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

    // START Node
    Graph.registerNode('uml-start', {
      inherit: 'circle', width: 42, height: 42,
      attrs: { 
        body: { fill: '#15803d', stroke: '#4ade80', strokeWidth: 2 },
        label: { text: '', fill: '#e3e1eb', fontSize: 11, refY: '120%' },
        text: { text: '\ue037', fontAttributes: 'normal normal normal 20px/1 "Material Symbols Outlined"', fill: '#fff', refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // TASK Node
    Graph.registerNode('uml-task', {
      inherit: 'rect', width: 140, height: 70,
      attrs: { 
        body: { rx: 6, ry: 6, fill: '#1e1f26', stroke: '#1e40af', strokeWidth: 2 },
        label: { text: 'Nueva Tarea', fill: '#e3e1eb', fontSize: 12, fontWeight: 'bold', refY: 0.6 },
        text: { text: '\ue85d', fontAttributes: 'normal normal normal 18px/1 "Material Symbols Outlined"', fill: '#b8c4ff', refX: 0.5, refY: 0.3, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // CONDITION (XOR Gateway) Node
    Graph.registerNode('uml-gateway-xor', {
      inherit: 'polygon', width: 50, height: 50,
      attrs: { 
        body: { points: '25,0 50,25 25,50 0,25', fill: '#1e1f26', stroke: '#b45309', strokeWidth: 2 },
        label: { text: '', fill: '#e3e1eb', fontSize: 11, refY: '120%' },
        text: { text: '\ue547', fontAttributes: 'normal normal normal 18px/1 "Material Symbols Outlined"', fill: '#ffb59a', refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // PARALLEL (AND Gateway) Node
    Graph.registerNode('uml-gateway-and', {
      inherit: 'polygon', width: 50, height: 50,
      attrs: { 
        body: { points: '25,0 50,25 25,50 0,25', fill: '#1e1f26', stroke: '#0891b2', strokeWidth: 2 },
        label: { text: '', fill: '#e3e1eb', fontSize: 11, refY: '120%' },
        text: { text: '\ue145', fontAttributes: 'normal normal normal 20px/1 "Material Symbols Outlined"', fill: '#67e8f9', refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // SERVICE TASK Node
    Graph.registerNode('uml-service-task', {
      inherit: 'rect', width: 140, height: 70,
      attrs: { 
        body: { rx: 6, ry: 6, fill: '#1e1f26', stroke: '#7c3aed', strokeWidth: 2 },
        label: { text: 'Servicio Automático', fill: '#e3e1eb', fontSize: 12, fontWeight: 'bold', refY: 0.6 },
        text: { text: '\ue869', fontAttributes: 'normal normal normal 18px/1 "Material Symbols Outlined"', fill: '#c4b5fd', refX: 0.5, refY: 0.3, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // ANNOTATION / NOTE Node
    Graph.registerNode('uml-note', {
      inherit: 'rect', width: 120, height: 50,
      attrs: { 
        body: { fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '5,5' },
        label: { text: 'Nota...', fill: '#92400e', fontSize: 11, refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });

    // END Node
    Graph.registerNode('uml-end', {
      inherit: 'circle', width: 42, height: 42,
      attrs: { 
        body: { fill: '#991b1b', stroke: '#ffb4ab', strokeWidth: 3 },
        label: { text: '', fill: '#e3e1eb', fontSize: 11, refY: '120%' },
        text: { text: '\ue047', fontAttributes: 'normal normal normal 20px/1 "Material Symbols Outlined"', fill: '#fff', refX: 0.5, refY: 0.5, textAnchor: 'middle', textVerticalAnchor: 'middle' }
      },
      ports: { ...portsList }
    });
  }

  private transformToBackendFormat() {
    const json = this.graph.toJSON();
    const nodes: any = {};
    const edges: any[] = [];

    json.cells.forEach((cell: any) => {
      if (cell.shape && cell.shape.startsWith('uml-')) {
        let type = 'TASK';
        if (cell.shape === 'uml-start') type = 'START';
        if (cell.shape === 'uml-end') type = 'END';
        if (cell.shape === 'uml-gateway-xor') type = 'CONDITION';
        if (cell.shape === 'uml-gateway-and') type = 'PARALLEL';
        if (cell.shape === 'uml-service-task') type = 'SERVICE_TASK';
        if (cell.shape === 'uml-note') return;

        nodes[cell.id] = {
          id: cell.id,
          type: type,
          name: cell.attrs?.['label']?.['text'] || cell.attrs?.['text']?.['text'] || 'Node',
          ...cell.data
        };
      } else if (cell.shape === 'edge') {
        edges.push({
          id: cell.id,
          source: cell.source.cell,
          target: cell.target.cell,
          conditionExpression: cell.data?.conditionExpression || cell.labels?.[0]?.attrs?.['label']?.['text'] || ''
        });
      }
    });

    return { nodes, edges };
  }

  private initDnd() {
    this.dnd = new Dnd({ target: this.graph, scaled: false, dndContainer: this.dndContainer.nativeElement });
  }

  startDrag(e: MouseEvent, type: string) {
    let node;
    switch (type) {
      case 'start': node = this.graph.createNode({ shape: 'uml-start' }); break;
      case 'task': node = this.graph.createNode({ shape: 'uml-task' }); break;
      case 'service-task': node = this.graph.createNode({ shape: 'uml-service-task' }); break;
      case 'gateway-xor': node = this.graph.createNode({ shape: 'uml-gateway-xor' }); break;
      case 'gateway-and': node = this.graph.createNode({ shape: 'uml-gateway-and' }); break;
      case 'note': node = this.graph.createNode({ shape: 'uml-note' }); break;
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
