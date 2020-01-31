import { Component, EventEmitter, Input, OnInit, Output, ElementRef } from '@angular/core';
import { fabric } from 'fabric';

@Component({
    selector: 'image-annotator',
    styleUrls: ['./image-annotator.component.scss'],
    templateUrl: './image-annotator.component.html'
})
export class ImageAnnotatorComponent implements OnInit {

    @Input() public src?: string;
    @Input() public annotations?: string;
    @Input() public maxWidth?: number = 350;
    @Input() public maxHeight?: number = 371;

    @Output() public onSave: EventEmitter<string> = new EventEmitter<string>();
    @Output() public onCancel: EventEmitter<void> = new EventEmitter<void>();

    public currentTool: string = 'brush';
    public currentSize: string = 'small';
    public currentColor: string = 'black';

    public canUndo: boolean = false;
    public canRedo: boolean = false;

    private canvas?: any;
    private stack: any[] = [];

    constructor(private domAccessor: ElementRef) {
    }

    public ngOnInit(): void {
        const canvas = new fabric.Canvas('canvas', {
            hoverCursor: 'pointer',
            isDrawingMode: true,
        });

        // HACK: did this because this control loads before the annotations are bound sometimes
        setTimeout( ()=>{   
          const imageOptions : fabric.IImageOptions = {
              crossOrigin: 'anonymous',
              originX: 'left',
              originY: 'top'
          };       
          if (this.annotations) {
              fabric.Image.fromURL(this.annotations, (image : fabric.Image)=>{
                let horizontalScaling : number = (this.maxWidth / image.width);
                let verticalScaling : number = (this.maxHeight / image.height);
                this.canvas.setWidth(image.width * horizontalScaling);
                this.canvas.setHeight(image.height * verticalScaling);
                this.canvas.setBackgroundImage(image, this.canvas.renderAll.bind(this.canvas), {
                    crossOrigin: 'anonymous',
                    originX: 'left',
                    originY: 'top',
                    scaleX: horizontalScaling,
                    scaleY: verticalScaling
                });
              }, imageOptions);
          } else if (this.src) {
              canvas.setBackgroundImage(this.src, ((img:fabric.Image) => {
                  canvas.setWidth(img.width);
                  canvas.setHeight(img.height);
              }), imageOptions);
          }
        }, 1000);

        canvas.on('path:created', (e) => {
            this.stack = [];
            this.setUndoRedo();
        });

        this.canvas = canvas;
        this.selectTool(this.currentTool);
        this.selectColor(this.currentColor);
        this.selectDrawingSize(this.currentSize);
    }

    // Tools

    public selectTool(tool: string) {
        this.currentTool = tool;
    }

    public selectDrawingSize(size: string) {
        this.currentSize = size;
        if (this.canvas !== null && this.canvas !== undefined) {
            if (size === 'small') {
                this.canvas.freeDrawingBrush.width = 5;
            } else if (size === 'medium') {
                this.canvas.freeDrawingBrush.width = 10;
            } else if (size === 'large') {
                this.canvas.freeDrawingBrush.width = 20;
            }
        }
    }

    public selectColor(color: string) {
        this.currentColor = color;
        if (this.canvas !== null && this.canvas !== undefined) {
            if (color === 'black') {
                this.canvas.freeDrawingBrush.color = '#000';
            } else if (color === 'white') {
                this.canvas.freeDrawingBrush.color = '#fff';
            } else if (color === 'yellow') {
                this.canvas.freeDrawingBrush.color = '#ffeb3b';
            } else if (color === 'red') {
                this.canvas.freeDrawingBrush.color = '#f44336';
            } else if (color === 'blue') {
                this.canvas.freeDrawingBrush.color = '#2196f3';
            } else if (color === 'green') {
                this.canvas.freeDrawingBrush.color = '#4caf50';
            }
        }
    }

    // Actions

    public undo() {
        if (this.canUndo) {
            const lastId = this.canvas.getObjects().length - 1;
            const lastObj = this.canvas.getObjects()[lastId];
            this.stack.push(lastObj);
            this.canvas.remove(lastObj);
            this.setUndoRedo();
        }
    }

    public redo() {
        if (this.canRedo) {
            const firstInStack = this.stack.splice(-1, 1)[0];
            if (firstInStack !== null && firstInStack !== undefined) {
                this.canvas.insertAt(firstInStack, this.canvas.getObjects().length - 1);
            }
            this.setUndoRedo();
        }
    }

    public clearCanvas() {
        if (this.canvas !== null && this.canvas !== undefined) {
            this.canvas.remove(...this.canvas.getObjects());
            this.setUndoRedo();

            this.canvas.setBackgroundImage(this.src, ((img:fabric.Image) => {
                this.canvas.setWidth(img.width);
                this.canvas.setHeight(img.height);
            }), {
                crossOrigin: 'anonymous',
                originX: 'left',
                originY: 'top'
            });
        }
    }

    public saveImage() {
      let dataURL : string = this.canvas.getElement().toDataURL();
      this.onSave.emit(dataURL);
    }

    public cancel() {
        this.onCancel.emit();
    }

    private setUndoRedo() {
        this.canUndo = this.canvas.getObjects().length > 0;
        this.canRedo = this.stack.length > 0;
    }
}