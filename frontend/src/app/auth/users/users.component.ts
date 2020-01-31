import { Component, OnInit, ElementRef } from '@angular/core';
import { AuthService } from '../auth.service';
import { ToastController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Escort, CompanyUser } from '../../apiClient';
import { merge } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  public escorts : any[] = [];
  public clients : any[] = [];

  constructor(
    private authService: AuthService,
    private domAccessor : ElementRef,
    private toaster : ToastController,
    private loader : LoadingController,
    private alertController : AlertController,
    private modalController : ModalController,) { }

  async ngOnInit() {
    await this.loadAllUsers();
    setTimeout( () => { this.formatTextFabButtons(); }, 3000);
  }


  async loadAllUsers() : Promise<void> {
    let loadUsers = await this.loader.create({
      message: 'Loading Users...'
    });
    await loadUsers.present();

    this.authService.getAllEscorts().subscribe(async (escorts:Escort[])=>{
      this.escorts = escorts.map( (v,i,l)=>{ return { checked: false, profile: v } } );
    });

    this.authService.getAllClients().subscribe(async (clients:CompanyUser[])=>{
      this.clients = clients.map( (v,i,l)=>{ return { checked: false, profile: v } } );
      await loadUsers.dismiss();
    });
  }

  
  formatTextFabButtons() : void {
    // HACK: Stylizes the fab-buttons that are text-fab so they have proper width
    let textFABs : any[] = this.domAccessor.nativeElement.getElementsByClassName('text-fab');
    for (let i = 0; i < textFABs.length; i++){
      let button : any = textFABs[i].shadowRoot.lastChild;
      button.style.width = '150px'
      button.style.borderRadius = '10px';
    }
  }


  toggleAllEscorts(evt : CustomEvent) : void { 
    this.escorts = this.escorts.map( (v,i,l)=>{ return { checked: evt.detail.checked, profile: v.profile } } ); 
  }
  toggleAllClients(evt : CustomEvent) : void { 
    this.clients = this.clients.map( (v,i,l)=>{ return { checked: evt.detail.checked, profile: v.profile } } ); 
  }


  sortAscending(clickedSorter:any, arrayToSort: string, columnNames: string[]) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortascending');

    let sortArray = (arrayToSort == 'escort') ? this.escorts : this.clients;

    let sortedArray = sortArray.sort( (a : any, b : any) => {
      let intermediateObjectA : any = a.profile, intermediateObjectB : any = b.profile;
      for (let i = 0; i < columnNames.length; i++) {
        intermediateObjectA = intermediateObjectA[columnNames[i]];
        intermediateObjectB = intermediateObjectB[columnNames[i]];
      }

      let valueA : string = ((intermediateObjectA === undefined) ? '' : intermediateObjectA.toString().toLowerCase());
      let valueB : string = ((intermediateObjectB === undefined) ? '' : intermediateObjectB.toString().toLowerCase());
      if (valueA < valueB) {
        return -1;
      } else if (valueA > valueB) {
        return 1;
      } else {
        return 0;
      }
    });

    if (arrayToSort == 'escort') {
      this.escorts = sortedArray;
    } else {
      this.clients = sortedArray;
    }
  }


  sortDescending(clickedSorter:any, arrayToSort: string, columnNames: string[]) : void {
    this.resetAllSorters();
    clickedSorter.target.parentElement.classList.add('sortdescending');

    let sortArray = (arrayToSort == 'escort') ? this.escorts : this.clients;

    let sortedArray = sortArray.sort( (a : any, b : any) => {
      let intermediateObjectA : any = a.profile, intermediateObjectB : any = b.profile;
      for (let i = 0; i < columnNames.length; i++) {
        intermediateObjectA = intermediateObjectA[columnNames[i]];
        intermediateObjectB = intermediateObjectB[columnNames[i]];
      }

      let valueA : string = ((intermediateObjectA === undefined) ? '' : intermediateObjectA.toString().toLowerCase());
      let valueB : string = ((intermediateObjectB === undefined) ? '' : intermediateObjectB.toString().toLowerCase());
      if (valueA < valueB) {
        return 1;
      } else if (valueA > valueB) {
        return -1;
      } else {
        return 0;
      }
    });

    if (arrayToSort == 'escort') {
      this.escorts = sortedArray;
    } else {
      this.clients = sortedArray;
    } 
  }


  resetAllSorters() : void {
    let allSorters : any[] = this.domAccessor.nativeElement.getElementsByClassName('sorter');
    for (let i = 0; i < allSorters.length; i++) {
      allSorters[i].classList.remove('sortascending');
      allSorters[i].classList.remove('sortdescending');
    }
  }


  async deleteUsers() : Promise<void> {
    let selectedEscortUserIDs : string[] = this.escorts.filter( (v,i,l)=>{ return v.checked == true; })
                                                       .map( (vx,ix,lx)=>{ return vx.profile.user.userID; });
    let selectedClientUserIDs : string[] = this.clients.filter( (v,i,l)=>{ return v.checked == true; })
                                                       .map( (vx,ix,lx)=>{ return vx.profile.user.userID; });

    let mergedUserIDs : string[] = selectedEscortUserIDs.concat(selectedClientUserIDs);

    if (mergedUserIDs.length > 0) {
      let alert = await this.alertController.create({
        header: 'DELETE CONFIRMATION', 
        message: 'Are you sure you want to delete the selected users?',   
        buttons: [
          { text:'Cancel', role: 'cancel',   cssClass: 'danger',      handler:       (data)=>{ return; }},
          { text:'Yes',                      cssClass: 'primary',     handler: async (data)=>{             
            let loading = await this.loader.create({ message: 'Deleting users...' });
            await loading.present();
            this.authService.deleteUsers(mergedUserIDs).subscribe( async (success:any)=>{
              await loading.dismiss();
              await this.loadAllUsers();
            });
          }}
        ]
      });
      await alert.present();
    }
  }


  async showNotEnabled() : Promise<void> {
    let alert = await this.alertController.create({
      header: 'FEATURE NOT ENABLED', 
      message: 'This feature is still under development.', 
      buttons: [
        { text:'OK',                      cssClass: 'primary', handler: (data)=>{ }}
      ]
    });
    alert.present();
  }

}
