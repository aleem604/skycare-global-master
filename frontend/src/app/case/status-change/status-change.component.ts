import { Component, OnInit, ElementRef } from '@angular/core';
import { CompanyCase, CaseStatusChange } from '../../apiClient';
import { ModalController, NavParams, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { FormBuilder } from '@angular/forms';
import { CaseService } from '../case.service';

@Component({
  selector: 'app-status-change',
  templateUrl: './status-change.component.html',
  styleUrls: ['./status-change.component.scss']
})
export class StatusChangeComponent implements OnInit {

  public currentCase : CompanyCase;


  public statuses : any[] = [
    { disabled: false, completed: false, message: 'Escort on way to origin city', dependentField: '' },
    { disabled: false, completed: false, message: 'Escort in origin city', dependentField: '' },
    { disabled: false, completed: false, message: 'Escort performed pre-flight assessment', dependentField: '' },
    { disabled: false, completed: false, message: 'Escort picked up patient on way to airport', dependentField: '' },
    { disabled: false, completed: false, message: 'Airport check-in complete and awaiting departure', dependentField: '' },
    { disabled: false, completed: false, message: 'Boarded & departed origin city', dependentField: '' },
    { disabled: true, completed: false, message: 'Arrived & waiting in connection airport 1', dependentField: 'connectionCity1' },
    { disabled: true, completed: false, message: 'Boarded & departed connection airport 1', dependentField: 'connectionCity1' },
    { disabled: true, completed: false, message: 'Arrived & waiting in connection airport 2', dependentField: 'connectionCity2' },
    { disabled: true, completed: false, message: 'Boarded & departed connection airport 2', dependentField: 'connectionCity2' },
    { disabled: false, completed: false, message: 'Escort & patient arrived destination city', dependentField: '' },
    { disabled: false, completed: false, message: 'Escort & patient with ground transport to final destination', dependentField: '' },
    { disabled: false, completed: false, message: 'Patient case successfully transferred at final destination', dependentField: '' },
    { disabled: false, completed: false, message: 'All case documentation & receipts complete', dependentField: '' }
  ];



  constructor(private caseService : CaseService,
              private modalController: ModalController,
              private alertController: AlertController,
              private loadingController : LoadingController,
              private toaster : ToastController,
              private navParams: NavParams,
              private formBuilder: FormBuilder,
              private domAccessor : ElementRef,) { }

  ngOnInit() {
  }


  ionViewWillEnter() {
    let suppliedCase : CompanyCase | undefined = this.navParams.get('currentCase');
    if ( suppliedCase !== undefined && suppliedCase != null ) {
      this.currentCase = suppliedCase;
      this.loadCaseStatus();
    }
  }


  loadCaseStatus() : void {
    for(let i = 0; i < this.statuses.length; i++) {
      if (this.statuses[i].dependentField.trim().length > 0) {
        this.statuses[i].disabled = (this.currentCase[this.statuses[i].dependentField.trim()] === undefined || this.currentCase[this.statuses[i].dependentField.trim()].trim().length == 0);
      }

      // Look for this status in the status change list
      this.statuses[i].completed = (this.currentCase.statusChanges.findIndex( 
                                                (v,ix,l)=>{return (v.newStatus==this.statuses[i].message);}
                                    ) > -1);
    }
  }


  async updateCurrentStatus(evt : MouseEvent | TouchEvent, index : number) : Promise<void> {
    if (this.caseService.getRole() != 'admin' && this.caseService.getRole() != 'escort') {
      // Cancel this change if the status was already indicated as completed      
      let alert = await this.alertController.create({
        header: 'Permission Error', 
        message: 'Only an Admin or an Escort can change Case Status'  ,       
        buttons: [{text:'OK', handler: (data)=>{
          if (this.statuses[index].completed) {
            evt.srcElement.classList.add('checkbox-checked');
          } else {
            evt.srcElement.classList.remove('checkbox-checked');
          }          
        }}]
      });
      alert.present();
    } else if (this.statuses[index].completed) {
      // Cancel this change if the status was already indicated as completed      
      let alert = await this.alertController.create({
        header: 'Status Change Error', 
        message: 'You cannot undo a status completion once it has been selected.'  ,       
        buttons: [{text:'OK', handler: (data)=>{
          evt.srcElement.classList.add('checkbox-checked');
        }}]
      });
      alert.present();
    } else if (index == 0 && !this.statuses[0].completed) {
      // If this is the first status update, and they selected the first item, then complete this update
      this.statuses[0].completed = true;
      this.verifyCaseStatusChange(0, evt.srcElement);
    } else {
      // Create a list of all incomplete indexes
      let incompleteStatusIndexes : number[]  = this.statuses.map( (v,i,l) => { if (v.completed || v.disabled) { return 100; } else { return i; }})
                                                             .filter( (vx,ix,lx) => { if (vx != 100) { return true; }});
      
      // Make sure the very next incomplete status is the one the user selected
      if (incompleteStatusIndexes[0] == index) {
        this.statuses[index].completed = true;
        this.verifyCaseStatusChange(index, evt.srcElement);
      } else {
        this.statuses[index].completed = false;
        let alert = await this.alertController.create({
          header: 'Status Change Error', 
          message: 'You must indicate status completion in order,<br/>from top to bottom.'  ,       
          buttons: [{text:'OK', handler: (data)=>{
            evt.srcElement.classList.remove('checkbox-checked');
          }}]
        });
        alert.present();
      }
    }
  }

  async verifyCaseStatusChange(newIndex : number, checkbox : Element) : Promise<void> {
    // Check if they are completing the final status for a special verification
    let header : string = '';
    let message : string = '';
    if (newIndex == this.statuses.length-1) {
      header = 'NO MORE CHANGES';
      message = '<div style="text-align: left;">Selecting this final status will restrict your ability to make any further changes to this case.<br/><br/>Do you want to send an email about this final status change?</div>';
    } else {
      header = 'CHANGE CONFIRMATION';
      message = '<div style="text-align: left;">Would you like to send an email notification when we change the case status to:<br/><br/><div style="border: solid 1px #333333;">' + this.statuses[newIndex].message.toUpperCase() + '</div></div>';
    }

    let alert = await this.alertController.create({
      header: header, 
      message: message, 
      inputs: [ { name: 'comment', placeholder: 'Add Comment' } ],      
      buttons: [
        { text:'Cancel', role: 'cancel',   cssClass: 'danger',      handler: (data)=>{ this.statuses[newIndex].completed = false;  checkbox.classList.remove('checkbox-checked'); }},
        { text:'No, save without email',   cssClass: 'secondary',   handler: (data)=>{ this.saveCaseStatusChange(this.statuses[newIndex].message, false, ''); }},
        { text:'Yes, save and send email', cssClass: 'primary',     handler: (data)=>{ this.saveCaseStatusChange(this.statuses[newIndex].message, true, data.comment); }}
      ]
    });
    alert.present();
  }

  async saveCaseStatusChange(newStatus : string, sendEmailNotice : boolean, additionalComments : string) : Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Updating Case Status...'
    });
    await loading.present();

    // Create the new case status change
    let newCaseStatusChange : CaseStatusChange = {
      newStatus: newStatus,
      oldStatus: this.currentCase.currentStatus,
      date: (new Date()).toISOString()
    };

    // Modify the current Case locally
    this.currentCase.currentStatus = newStatus;
    this.currentCase.statusChanges.push(newCaseStatusChange);

    // Update the Case on the server
    this.caseService.updateCase(this.currentCase.companyID, this.currentCase.caseID, this.currentCase, sendEmailNotice, additionalComments).subscribe(
      async (success: any) => {
        await loading.dismiss();

        await this.modalController.dismiss( this.currentCase );

        const toast = await this.toaster.create({
          message: 'Updated the Case Status',
          duration: 2000     
        })
        await toast.present();
      }
    );
  }

  async close() : Promise<void> {
    await this.modalController.dismiss();
  }

}
