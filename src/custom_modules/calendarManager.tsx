import RNCalendarEvents, { AuthorizationStatus, Calendar, CalendarEventReadable, CalendarOptions, ISODateString, RecurrenceRule } from '../CalendarModule';
import moment from 'moment';
import 'moment/locale/ko';
import axios from 'axios';
import AsyncStorage from '@react-native-community/async-storage';
import { CalendarEventWritable } from './../CalendarModule/index.d';

/**
 * 권한요청 (수락될때 까지)
 * @returns 권한요청 결과
 */
export async function permissionCheck(): Promise<AuthorizationStatus> {
    while (true) {
        console.log('check func On');
        let res = await RNCalendarEvents.checkPermissions(false); //권한요청 readOnly 읽기전용
        console.log(res);
        if (res != 'authorized') {
            // 권한 재요청
            await RNCalendarEvents.requestPermissions(false);
        } else {
            return res;
        } // res authorized denied restricted
    }
}

/**
 * 캘린더 생성
 * @param params 캘린더 이름, 타이틀(?)
 * @returns 캘린더 id
 */
export async function calCreateFunc(params: { title: string, name: string }) {
    let calInfO: CalendarOptions = {
        title: params.title,
        source: {
            name: 'calendar control sample App',
            isLocalAccount: true,
            type: 'LOCAL',
        },
        name: params.name,
        color: '#D75F64',
        accessLevel: 'editor',
        ownerAccount: 'LOCAL',
        entityType: 'event',
    };
    const id = await RNCalendarEvents.saveCalendar(calInfO);
    console.log('id: ' + id);
    return id;
}

/**
 * 캘린더 삭제
 * @param id 삭제할 캘린더 id
 * @returns 삭제결과
 */
export async function calRemoveFunc(id: string) {
    const res = await RNCalendarEvents.removeCalendar(id);
    return res; // bool true or false
}

/**
 * 캘린더 리스트 조회 및 정렬
 * @returns 정렬된 Calendar object
 */
export async function calFetchFunc() {
    const res = await RNCalendarEvents.findCalendars();
    console.log(res);
    const googleCalData = res.filter((i) => {
        //구글 캘린더 필터링
        return i.type === 'com.google' || i.source === 'Gmail';
    });
    const localCalData = res.filter((i) => {
        //로컬 캘린더 필터링
        return i.type === 'LOCAL' || i.source === 'Default';
    });
    const samCalData = res.filter((i) => {
        //삼성 캘린더 필터링
        return i.type === 'com.osp.app.signin';
    });
    const icloudCalData = res.filter((i) => {
        //기타 캘린더 필터링
        return i.source === 'iCloud';
    });
    const otherCalendars = res.filter((i) => {
        //기타 캘린더 필터링
        return i.source === 'Other';
    });
    const parsingRes = { google: googleCalData, local: localCalData, samsung: samCalData, others: otherCalendars, icloud: icloudCalData };
    return parsingRes;
}

export async function eventSaveFunc(eventTitle: string, eventData: CalendarEventWritable, exception: string | undefined = undefined) {
    let event = eventData;
    event.startDate = moment(event.startDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'); //이벤트 저장시 09시간 빼야함
    if (event.endDate) {
        event.endDate = moment(event.endDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }
    if (event.recurrenceRule?.endDate) {
        event.recurrenceRule.endDate = moment(event.recurrenceRule.endDate).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }
    let exceptionDateTime = exception
    if (exception) {
        exceptionDateTime = moment(exception).format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }
    console.log('//////////////////////////');
    console.log(event);
    console.log(exception);

    let res;
    try {
        if (exception == null) {
            res = await RNCalendarEvents.saveEvent(eventTitle, event)
        } else {
            console.log('exception on');
            res = await RNCalendarEvents.saveEvent(eventTitle, event, { exceptionDate: exceptionDateTime, futureEvents: false });
        }
        const te = await RNCalendarEvents.findEventById(res);
        console.log(te);
        console.log(res);
        return res;
    } catch (err) {
        console.warn(err);
    }
}

export async function eventFindId(id: string) {
    const res = await RNCalendarEvents.findEventById(id);
    return res;
}

export async function eventFetchFunc(data: { start: ISODateString, end: ISODateString, calId: string[] }) {
    const res = await RNCalendarEvents.fetchAllEvents(data.start, data.end, data.calId);
    let item: any = {}; //RN calendar에 표시하기위한 데이터 파싱
    res.map((i) => {
        const date = moment(i.startDate).format('YYYY-MM-DD');
        const during = { start: i.startDate, end: i.endDate };
        if (item[date] != null) {
            //동일 날짜 이벤트
            item[date] = [...item[date], { name: i.title, id: i.id, during: during }];
        } else {
            item[date] = [{ name: i.title, id: i.id, during: during }];
        }
    });
    // 아래는 Option 일정이 없는 날짜에 빈 배열 추가
    let beforeDate = moment(data.start);
    while (true) {
        if (moment(beforeDate).isBefore(data.end)) {
            // fetch종료 날짜까지 빈데이터 탐색
            const date = moment(beforeDate).format('YYYY-MM-DD');
            if (item[date] == null) {
                item[date] = [];
            }
            beforeDate = moment(beforeDate).add('1', 'd'); // startDate 에 하루씩 추가하며 반복
        } else {
            break;
        }
    }
    return item;
    // Ex) item = {date:[{name:'타이틀', id: '이벤트 id', during: {start: '시작시간', end: '종료시간'}}, {..} ], ......}
}

export async function eventRemoveFunc(id: string) {
    //이벤트 삭제
    const res = await RNCalendarEvents.removeEvent(id, { futureEvents: true });
    return res; //삭제 결과
}

/* export async function eventSend(titleIn:string, dataIn, id:string) {
    //이벤트 서버로 전송
    console.log('sendStart');
    const key = Math.floor(Math.random() * 109951162777600).toString(16);
    AsyncStorage.setItem('eventKeys', JSON.stringify({ key: key, id: id }));
    let parseData = {
        //서버 전송용으로 기존데이터 파싱
        title: titleIn,
        id: key,
        allDay: dataIn.allDay,
        startDate: moment(dataIn.startDate).add('09:00'), //이벤트 저장중에 9시간을 뺏기때문에 다시더함 서버에서 확인 필요
        alarms: '',
        description: "",
        endDate: "",

    };

    if (dataIn.alarms != "") {
        //알림 데이터 삽입
        parseData = { ...parseData, alarms: dataIn.alarms };
    } else {
        parseData = { ...parseData, alarms: '' };
    }

    if (dataIn.description != "") {
        //설명 데이터 삽입
        parseData = { ...parseData, description: dataIn.description };
    } else {
        parseData = { ...parseData, description: '' };
    }

    //반복 규칙 삽입
    if (dataIn.recurrenceRule != null) {
        //반복일정시 event Save를 위해 endDate를 지웠기 때문에 duration을 이용하여 다시만듬
        const duration = dataIn.recurrenceRule.duration;
        if (duration == 'P1D') {
            //endDate 제작
            parseData = { ...parseData, endDate: moment(parseData.startDate).add(1, 'd') }; //P1D = 하루동안-> 종료날짜 하루뒤
        } else if (duration.indexOf('S') != -1) {
            //S 시간차이 초단위 구분 ex 3600S = 60분
            const second = duration.substring(duration.indexOf('P') + 1, duration.indexOf('S'));
            console.log(second);
            parseData = { ...parseData, endDate: moment(parseData.startDate).add(second, 's').format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z' };
        } else if (duration.indexOf('H') != -1) {
            const hour = duration.substring(duration.indexOf('T') + 1, duration.indexOf('H'));
            console.log(hour);
            parseData = { ...parseData, endDate: moment(parseData.startDate).add(hour, 'h').format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z' };
        }
        let recData:RecurrenceRule;
        if (dataIn.recurrenceRule.frequency != null) {
            recData = { ...recData, frequency: dataIn.recurrenceRule.frequency };
        }
        if (dataIn.recurrenceRule.interval != null) {
            recData = { ...recData, interval: dataIn.recurrenceRule.interval };
        } else {
            recData = { ...recData, interval: '' };
        }
        if (dataIn.recurrenceRule.occurrence != null) {
            recData = { ...recData, occurrence: dataIn.recurrenceRule.occurrence };
        } else {
            recData = { ...recData, occurrence: '' };
        }
        if (dataIn.recurrenceRule.daysOfWeek != null) {
            recData = { ...recData, daysOfWeek: dataIn.recurrenceRule.daysOfWeek };
        } else {
            recData = { ...recData, daysOfWeek: '' };
        }
        if (dataIn.recurrenceRule.recEndDate != null) {
            recData = { ...recData, recEndDate: dataIn.recurrenceRule.endDate };
        } else {
            recData = { ...recData, recEndDate: '' };
        }
        if (dataIn.recurrenceRule.weekPositionInMonth != null) {
            recData = { ...recData, weekPositionInMonth: dataIn.recurrenceRule.weekPositionInMonth };
        } else {
            recData = { ...recData, weekPositionInMonth: '' };
        }
        if (dataIn.recurrenceRule.monthPositionInMonth != null) {
            recData = { ...recData, monthPositionInMonth: dataIn.recurrenceRule.monthPositionInMonth };
        } else {
            recData = { ...recData, monthPositionInMonth: '' };
        }
        parseData = { ...parseData, recurrenceRule: recData };
    } else {
        parseData = {
            //반복일정이 아닐때 빈 recurrenceRule 데이터 전송
            ...parseData,
            endDate: moment(dataIn.endDate).add('09:00'),
            recurrenceRule: {
                frequency: '',
                interval: 0,
                occurrence: 0,
                daysOfWeek: '',
                recEndDate: '',
                daysOfWeek: '',
                weekPositionInMonth: 0,
                monthPositionInMonth: 0,
            },
        };
    }

    console.log(parseData);
    // axios({
    //     method: 'post',
    //     url: 'https://ntm.nanoit.kr/ysh/calendar/test20211008/UploadFullCalendar/insertApi.php',
    //     headers: {
    //         "Content-Type": 'application/json',
    //         "Accept": "application/json"
    //     },
    //     data: parseData
    // }).then(res => {
    //     console.log(res.data);
    // }).catch(err => {
    //     console.log(err);
    // })

    // axios.post('https://ntm.nanoit.kr/ysh/calendar/test20211008/UploadFullCalendar/insertApi.php',
    //     null
    //     , {
    //         params: parseData,
    //         headers: {
    //             "Content-Type": 'application/json',
    //             "Accept": "application/json"
    //         }
    //     }
    // )
    //     .then(function (response) {

    //         console.log(response.request.response);
    //         // setTxt('log: ' + JSON.parse(response.request.response))
    //         // setTxt2(JSON.stringify(response))
    //         //console.log(response);

    //     }).catch(function (error) {
    //         console.log(error);
    //     })
} */
