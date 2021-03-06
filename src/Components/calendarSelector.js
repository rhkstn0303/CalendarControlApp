import React, { useState, useEffect } from 'react';
import * as calendarClass from '../custom_modules/calendarManager';
import { View, TouchableOpacity, Text } from 'react-native';

export default selectCal = ({ navigation }) => {
    //캘린더 선택 화면
    const [active, setActive] = useState();
    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        console.log('initOn');
        const data = await calendarClass.calFetchFunc();
        console.log(data.google);
        //캘린더 분류
        setActive(
            <View>
                {data.google != '' && <Text style={{ fontSize: 25, fontWeight: 'bold' }}>Google Calendars</Text>}
                {data.google.map((i, key) => {
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => {
                                selectedCal(i.id, i.title);
                            }}>
                            <Text>{i.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                {data.local != '' && <Text style={{ fontSize: 25, fontWeight: 'bold' }}>Local Calendars</Text>}
                {data.local.map((i, key) => {
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => {
                                selectedCal(i.id, i.title);
                            }}>
                            <Text>{i.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                {data.samsung != '' && <Text style={{ fontSize: 25, fontWeight: 'bold' }}>Samsung Calendars</Text>}
                {data.samsung.map((i, key) => {
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => {
                                selectedCal(i.id, i.title);
                            }}>
                            <Text>{i.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                {data.icloud != '' && <Text style={{ fontSize: 25, fontWeight: 'bold' }}>iCloud Calendars</Text>}
                {data.icloud.map((i, key) => {
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => {
                                selectedCal(i.id, i.title);
                            }}>
                            <Text>{i.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                {data.others != '' && <Text style={{ fontSize: 25, fontWeight: 'bold' }}>Other Calendars</Text>}
                {data.others.map((i, key) => {
                    return (
                        <TouchableOpacity
                            key={key}
                            onPress={() => {
                                selectedCal(i.id, i.title);
                            }}>
                            <Text>{i.title}</Text>
                        </TouchableOpacity>
                    );
                })}
                {data.google == '' && data.local == '' && data.samsung == '' && data.others == '' && data.icloud == '' && (
                    <Text style={{ fontSize: 25, fontWeight: 'bold' }}>캘린더가 없습니다.</Text>
                )}
            </View>
        );
    };
    const selectedCal = (id, title) => {
        //캘린더 선택시 이전화면으로 id 와 title을 넘김
        navigation.navigate('Save Event', { id: id, title, title });
    };

    return <View style={{ margin: 15 }}>{active}</View>;
};
