import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Graph, Shape } from '@antv/x6';
import { Dnd } from '@antv/x6-plugin-dnd';
import { Keyboard } from '@antv/x6-plugin-keyboard';
import { Selection } from '@antv/x6-plugin-selection';
import { Snapline } from '@antv/x6-plugin-snapline';
import { Scroller } from '@antv/x6-plugin-scroller';
import { History } from '@antv/x6-plugin-history';
import { Export } from '@antv/x6-plugin-export';

@Component({
  selector: 'app-policy-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './policy-editor.component.html'
})
export class PolicyEditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('graphContainer') graphContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dndContainer') dndContainer!: ElementRef<HTMLElement>;

  private graph!: Graph;
  private dnd!: Dnd;

  saveStatus: 'Guardado' | 'Guardando...' | 'Error' = 'Guardado';
  saveTimeout: any;
  autoSaveInterval: any;

  canUndo = false;
  canRedo = false;

  selectedNode: any = null;
  nodeType: string = '';
  nodeData: any = {};
  validationErrors: {id: string, message: string}[] = [];

  ngAfterViewInit() {
    this.initGraph();
    this.initPlugins();
    this.registerCustomNodes();
    this.initDnd();
    this.initEvents();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    if (this.graph) this.graph.dispose();
  }

  private initGraph() {
    this.graph = new Graph({
      container: this.graphContainer.nativeElement,
      autoResize: true,
      background: { color: '#f8f9fa' },
      grid: {
        visible: true,
        type: 'dot',
        size: 10,
        args: { color: '#e0e0e0', thickness: 1 }
      },
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
                stroke: '#5A5A5A',
                strokeWidth: 2,
                targetMarker: { name: 'classic', size: 8 },
              },
            },
            labels: [{ attrs: { label: { text: '' } } }],
            tools: ['edge-editor', 'button-remove']
          });
        },
        validateConnection({ targetMagnet }) { return !!targetMagnet; },
      },
    });
  }

  private initPlugins() {
    // Teclado para borrar
    this.graph.use(new Keyboard({ enabled: true, global: true }));
    this.graph.bindKey(['backspace', 'delete'], () => {
      const cells = this.graph.getSelectedCells();
      if (cells.length) this.graph.removeCells(cells);
    });

    // Selección
    this.graph.use(new Selection({
      enabled: true, multiple: true, rubberband: true, showNodeSelectionBox: true,
    }));

    // Guias magnéticas
    this.graph.use(new Snapline({ enabled: true, sharp: true }));

    // Export PNG
    this.graph.use(new Export());

    // Historial con auto-save y bindings
    this.graph.use(new History({ enabled: true }));

    this.graph.bindKey(['ctrl+z', 'meta+z'], () => { this.undo(); return false; });
    this.graph.bindKey(['ctrl+y', 'meta+y', 'ctrl+shift+z'], () => { this.redo(); return false; });
    this.graph.bindKey(['ctrl+s', 'meta+s'], (e) => {
        e.preventDefault();
        this.saveToBackend();
        return false;
    });

    this.graph.on('history:change', () => {
      this.canUndo = this.graph.canUndo();
      this.canRedo = this.graph.canRedo();
      this.markNeedsSave();
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

    // Herramientas en aristas
    this.graph.on('edge:mouseenter', ({ edge }) => {
      edge.addTools(['source-arrowhead', 'target-arrowhead', { name: 'button-remove', args: { distance: -30 } }]);
    });
    this.graph.on('edge:mouseleave', ({ edge }) => edge.removeTools());

    // Magnetos en nodos
    this.graph.on('node:mouseenter', () => {
      const ports = this.graphContainer.nativeElement.querySelectorAll('.x6-port-body') as NodeListOf<HTMLElement>;
      ports.forEach(p => p.style.visibility = 'visible');
    });
    this.graph.on('node:mouseleave', () => {
      const ports = this.graphContainer.nativeElement.querySelectorAll('.x6-port-body') as NodeListOf<HTMLElement>;
      ports.forEach(p => p.style.visibility = 'hidden');
    });
  }

  // Métodos de Propiedades (Properties Panel)
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

  // Historial, Exportar, y Guardado
  undo() { if (this.graph.canUndo()) this.graph.undo(); }
  redo() { if (this.graph.canRedo()) this.graph.redo(); }

  exportPNG() {
    this.graph.exportPNG('smartworkflow_policy.png', {
      padding: 20,
      backgroundColor: '#ffffff'
    });
  }

  setupAutoSave() {
    // Autoguardado cada 30s
    this.autoSaveInterval = setInterval(() => {
      if (this.saveStatus === 'Guardando...') {
        this.saveToBackend();
      }
    }, 30000); // 30 segundos
  }

  markNeedsSave() {
    if(this.saveStatus !== 'Error') {
      this.saveStatus = 'Guardando...';
    }
  }

  saveToBackend() {
    this.saveStatus = 'Guardando...';
    if(this.saveTimeout) clearTimeout(this.saveTimeout);
    // Simula una petición al backend
    this.saveTimeout = setTimeout(() => {
      this.saveStatus = 'Guardado';
    }, 800);
  }

  // Validación Visual
  validateGraph() {
    this.validationErrors = [];
    const nodes = this.graph.getNodes();
    // Limpia colores de advertencia
    nodes.forEach(n => {
      if (n.shape === 'uml-task') n.attr('body/stroke', '#1890ff');
      else if (n.shape === 'uml-start') n.attr('body/stroke', '#52c41a');
      else if (n.shape === 'uml-gateway-xor') n.attr('body/stroke', '#fa8c16');
      else if (n.shape === 'uml-gateway-and') n.attr('body/stroke', '#722ed1');
      else if (n.shape === 'uml-end') n.attr('body/stroke', '#f5222d');
    });

    let hasStart = false;
    let hasEnd = false;

    // Validación mock local
    nodes.forEach(n => {
      if (n.shape === 'uml-start') hasStart = true;
      if (n.shape === 'uml-end') hasEnd = true;

      // Validación para Tarea: Departamento requerido, Name requerido
      if (n.shape === 'uml-task') {
        const data = n.getData() || {};
        const label = n.attr('label/text') as string;
        if (!data.department || data.department === '') {
          this.validationErrors.push({ id: n.id, message: `La tarea "${label}" no tiene departamento asignado.`});
          n.attr('body/stroke', '#ff4d4f'); // Highlight rojo
        }
        if (!label || label.trim() === 'Nueva Tarea') {
           this.validationErrors.push({ id: n.id, message: `La tarea (ID: ${n.id.substring(0,4)}...) tiene un nombre genérico o vacío.`});
           n.attr('body/stroke', '#ff4d4f');
        }
      }
    });

    if (!hasStart) this.validationErrors.push({id: 'none', message: 'Falta Evento de Inicio.'});
    if (!hasEnd) this.validationErrors.push({id: 'none', message: 'Falta Evento de Fin.'});

    if (this.validationErrors.length === 0) {
      alert("Diagrama válido. Validación exitosa.\nListo para publicar en el Workflow Engine.");
    }
  }

  clearValidation() {
    this.validationErrors = [];
    const nodes = this.graph.getNodes();
    nodes.forEach(n => {
        if (n.shape === 'uml-task') n.attr('body/stroke', '#1890ff');
    });
  }

  checkXorCoverage() {
    if (!this.selectedNode) return;
    const edges = this.graph.getConnectedEdges(this.selectedNode);
    const outgoingEdges = edges.filter(e => e.getSourceCellId() === this.selectedNode.id);

    if(outgoingEdges.length < 2) {
      alert('Error Analítico: Un Gateway XOR debe tener al menos 2 flujos/aristas salientes.');
      return;
    }

    const conditions = outgoingEdges.map(e => e.getLabelAt(0)?.attrs?.['label']?.['text']);
    alert(`Verificando aristas salientes asociadas al Gateway: \n[ ${conditions.join(', ')} ]\n\nPor favor valide que estos cubran el 100% de la ramificación lógica en configuración.`);
  }

  forcePublish() {
    if(confirm('Aviso: Va a publicar un flujo con warnings que no rompen estructuralmente. ¿Desea continuar?')) {
        this.clearValidation();
        this.saveToBackend();
        alert('Publicado con warnings confirmados.');
    }
  }

  private registerCustomNodes() {
    const portAttrs = {
      circle: {
        r: 5, magnet: true, stroke: '#5A5A5A', strokeWidth: 1, fill: '#fff', style: { visibility: 'hidden' },
      },
    };

    const portsList = {
      groups: {
        top: { position: 'top', attrs: portAttrs },
        right: { position: 'right', attrs: portAttrs },
        bottom: { position: 'bottom', attrs: portAttrs },
        left: { position: 'left', attrs: portAttrs },
      },
      items: [
        { group: 'top', id: 'port-top' }, { group: 'right', id: 'port-right' },
        { group: 'bottom', id: 'port-bottom' }, { group: 'left', id: 'port-left' },
      ],
    };

    Graph.registerNode('uml-start', { inherit: 'circle', width: 40, height: 40, attrs: { body: { fill: '#f6ffed', stroke: '#52c41a', strokeWidth: 2 } }, ports: { ...portsList } });
    Graph.registerNode('uml-task', {
      inherit: 'rect', width: 110, height: 60, markup: [ { tagName: 'rect', selector: 'body' }, { tagName: 'text', selector: 'label' } ],
      attrs: { body: { rx: 8, ry: 8, fill: '#e6f7ff', stroke: '#1890ff', strokeWidth: 2 }, label: { text: 'Nueva Tarea', fill: '#000', fontSize: 13, fontFamily: 'sans-serif', refX: 0.5, refY: 0.5 } },
      ports: { ...portsList }
    });
    Graph.registerNode('uml-gateway-xor', { inherit: 'polygon', width: 60, height: 60, attrs: { body: { points: '30,0 60,30 30,60 0,30', fill: '#fff7e6', stroke: '#fa8c16', strokeWidth: 2 }, label: { text: 'X', fontSize: 24, fill: '#fa8c16', fontWeight: 'bold' } }, ports: { ...portsList } });
    Graph.registerNode('uml-gateway-and', { inherit: 'polygon', width: 60, height: 60, attrs: { body: { points: '30,0 60,30 30,60 0,30', fill: '#f9f0ff', stroke: '#722ed1', strokeWidth: 2 }, label: { text: '+', fontSize: 32, fill: '#722ed1', fontWeight: 'bold' } }, ports: { ...portsList } });
    Graph.registerNode('uml-end', { inherit: 'circle', width: 40, height: 40, markup: [ { tagName: 'circle', selector: 'outer' }, { tagName: 'circle', selector: 'inner' } ], attrs: { outer: { r: 20, cx: 20, cy: 20, fill: '#fff1f0', stroke: '#f5222d', strokeWidth: 2 }, inner: { r: 14, cx: 20, cy: 20, fill: '#fff1f0', stroke: '#f5222d', strokeWidth: 4 } }, ports: { ...portsList } });
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
      case 'gateway-and': node = this.graph.createNode({ shape: 'uml-gateway-and' }); break;
      case 'end': node = this.graph.createNode({ shape: 'uml-end' }); break;
    }
    if (node) this.dnd.start(node, e);
  }
}
