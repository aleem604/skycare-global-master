
import { Pipe, PipeTransform }  from '@angular/core';

@Pipe({ name: 'personName' })
export class PersonNamePipe implements PipeTransform {
    transform(name : string) : string {
        let returnName : string = '';
        let nameParts : string[] = name.split(' ');
        returnName = nameParts[0];

        if ( nameParts.length > 1 ) {
            returnName += ' ' + nameParts[1].substr(0,1).toUpperCase();
        }

        return returnName;
    }
}