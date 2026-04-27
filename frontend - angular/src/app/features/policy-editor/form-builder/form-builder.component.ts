import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

export interface FormField {
  type: string;
  name: string;
  label: string;
  required: boolean;
  options?: string; // comma separated for select
}

@Component({
  selector: 'app-form-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.css']
})
export class FormBuilderComponent {
  @Output() schemaSaved = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  availableFields: FormField[] = [
    { type: 'string', name: 'text_field', label: 'Texto Corto', required: false },
    { type: 'number', name: 'number_field', label: 'Número', required: false },
    { type: 'select', name: 'select_field', label: 'Selección Múltiple', required: false, options: 'Opción 1,Opción 2' },
    { type: 'date', name: 'date_field', label: 'Fecha', required: false },
    { type: 'file', name: 'file_field', label: 'Archivo Adjunto', required: false }
  ];

  formFields: FormField[] = [];

  selectedField: FormField | null = null;

  drop(event: CdkDragDrop<FormField[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const clonedItem = JSON.parse(JSON.stringify(event.previousContainer.data[event.previousIndex]));
      clonedItem.name = clonedItem.type + '_' + new Date().getTime(); // unique name
      this.formFields.splice(event.currentIndex, 0, clonedItem);
      this.selectedField = clonedItem;
    }
  }

  selectField(field: FormField) {
    this.selectedField = field;
  }

  removeField(index: number, event: Event) {
    event.stopPropagation();
    if(this.selectedField === this.formFields[index]) {
      this.selectedField = null;
    }
    this.formFields.splice(index, 1);
  }

  generateJsonSchema(): any {
    const schema: any = {
      type: 'object',
      properties: {},
      required: []
    };

    this.formFields.forEach(field => {
      let propertySchema: any = {
        type: field.type === 'number' ? 'number' : 'string',
        title: field.label
      };

      if (field.type === 'select') {
        propertySchema.enum = field.options ? field.options.split(',').map(o => o.trim()) : [];
      }
      if (field.type === 'date') {
        propertySchema.format = 'date';
      }
      if (field.type === 'file') {
        propertySchema.format = 'data-url'; // standard way to represent a file in some JSON schema ui extensions
      }

      schema.properties[field.name] = propertySchema;
      
      if (field.required) {
        schema.required.push(field.name);
      }
    });

    if (schema.required.length === 0) delete schema.required;

    return schema;
  }

  save() {
    this.schemaSaved.emit(this.generateJsonSchema());
  }

  onCancel() {
    this.cancel.emit();
  }

  get jsonSchemaPreview(): string {
    return JSON.stringify(this.generateJsonSchema(), null, 2);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'string': return 'short_text';
      case 'number': return 'numbers';
      case 'select': return 'arrow_drop_down_circle';
      case 'date': return 'calendar_today';
      case 'file': return 'upload_file';
      case 'checkbox': return 'check_box';
      case 'radio': return 'radio_button_checked';
      default: return 'list';
    }
  }
}
