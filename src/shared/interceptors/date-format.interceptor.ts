import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment-timezone';

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.formatDates(data);
      }),
    );
  }

  private formatDates(data: any): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.formatDates(item));
    } else if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          if (
            key === 'createdAt' ||
            key === 'updatedAt' ||
            key === 'date' ||
            key === 'startDate' ||
            key === 'endDate'
          ) {
            data[key] = moment(data[key])
              .locale('es')
              .tz('America/Guayaquil')
              .format('dddd, MMMM D YYYY, h:mm a');
          } else {
            data[key] = this.formatDates(data[key]);
          }
        }
      }
    }
    return data;
  }
}
