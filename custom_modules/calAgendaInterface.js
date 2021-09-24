import React, { useState, useEffect, useCallback } from 'react'
import { View, Button, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import moment from 'moment';
import * as calendarClass from './calendarClass'
import { useFocusEffect } from '@react-navigation/native';
import { Agenda } from 'react-native-calendars';


export default calAgendaInterface = ({ navigation }) => {
    const [items, setItems] = useState({});
    const [fin, setFin] = useState(false); // Loading 상태 state
    const [fetchData, setFetchData] = useState({ start: '2020-12-01T00:00:00.000Z', end: '2021-10-30T19:26:00.000Z' }) // data fetch 범위
    const check = async () => { //권한 체크
        const res = await calendarClass.permissionCheck() // authorized => 허용, restricted, denied => 거부
        if (res == 'authorized') {
            fetchF();
        }
    }

    const fetchF = async () => {
        setFin(false); // 데이터 불러올때까지 spinner 작동
        const res = await calendarClass.eventFetchFunc(fetchData)
        setItems(res);
        setFin(true);
    }

    useEffect(() => { // 초기 셋팅
        check();
    }, [])

    useFocusEffect(useCallback( //포커스가 돌아왔을때 다시로딩
        () => {
            fetchF();
        },
        [],
    ))

    const remove = async (id, title) => {    //이벤트 삭제
        const res = await calendarClass.eventRemoveFunc(id);
        console.log(res) // true or false
        fetchF();
    }

    const renderItem = (item) => { //아이템 렌더링
        return (
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 3 }}>
                    <TouchableOpacity
                        style={[styles.item, { height: item.height }]}
                        onPress={() => { navigation.navigate('Save Event Main', { screen: 'Save Event', params: { eventId: item.id } }) }}//일정 수정
                    >
                        <Text>{item.name}</Text>
                        <Text>{moment(item.during.start).format("MM/DD  HH:mm")} ~</Text><Text>{moment(item.during.end).format("MM/DD  HH:mm")}</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                    <TouchableOpacity
                        style={[styles.item, { height: item.height }]}
                        onPress={() => { remove(item.id, item.name); }}>
                        <Text>
                            삭제
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const renderEmptyDate = () => { // 빈 아이템 렌더링
        return (
            <View></View>
        );
    }

    const loadItems = (day) => { // 스크롤 시 작동하는 함수 인것같음 좀더 확인 필요
        console.log(day);
        const loadDate = moment(day.dateString).format('YYYY-MM-01')
        console.log(loadDate)
    }

    return (
        <View style={{ height: '90%' }}>
            {fin ?
                <Agenda
                    items={items}
                    renderItem={renderItem}
                    renderEmptyDate={renderEmptyDate}
                    // hideKnob={true}
                    pastScrollRange={100}
                    futureScrollRange={100}
                    minDate={moment(fetchData.start).format('YYYY-MM-DD')}
                    maxDate={moment(fetchData.end).format('YYYY-MM-DD')}
                    loadItemsForMonth={loadItems}
                />
                : <ActivityIndicator size="large" />
            }
            <Button
                onPress={() => { fetchF() }}
                title="새로고침"
            />
            <TouchableOpacity
                onPress={() => { navigation.navigate('Save Event Main') }}
                style={[{ justifyContent: 'center' }, styles.touchs]}>
                <Text style={{ color: 'white' }}>일정 추가</Text>
            </TouchableOpacity>

        </View>
    )
}
const styles = StyleSheet.create(
    {
        touchs: {
            justifyContent: 'center',
            backgroundColor: '#5A18C9',
            height: 50,
            alignItems: 'center',
            margin: 5,

        },
        item: {
            backgroundColor: 'white',
            flex: 1,
            borderRadius: 5,
            padding: 10,
            marginRight: 10,
            marginTop: 17
        },
    }
)