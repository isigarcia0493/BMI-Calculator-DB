import React, { useState, useEffect } from 'react';
import { SafeAreaView, 
         StyleSheet, 
         Text, 
         TextInput, 
         Pressable, 
         View, 
         ScrollView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as SQLite from "expo-sqlite";

SplashScreen.preventAutoHideAsync();
setTimeout(SplashScreen.hideAsync, 2000);

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("bmiDB.db");
  return db;
}

const db = openDatabase();

export default function App() {
  let [weigth, setWeight] = useState(0.0);
  let [height, setHeight] = useState(0.0);
  let [message, setMessage] = useState('');
  let [calculatedValue, setCalculatedValue] = useState(0.0);
  const [histories, setHistories] = useState(null);
  const standards = { 
      'Underweight' : 18.5, 
      'HealthyStarts' : 18.5,
      'HealthyEnds' : 24.9,
      'OverweightStarts' : 25.0,
      'OverweightEnds' : 29.9,
      "Obese" : 30.0
    }

    useEffect(() => {
      db.transaction((tx) => {
        tx.executeSql(
          "create table if not exists BMICalculator (id integer primary key not null, weight real, height real, bmi real, bmiDate real);"
        )
      })

      db.transaction((tx) => {
        tx.executeSql(
          `select id, weight, height, bmi, date(bmiDate) as bmiDate from BMICalculator order by bmiDate desc;`,
          null,
          (_, { rows: { _array } }) => setHistories(_array)
        )

      })

    }, [calculatedValue])

    const add = (weight, height, bmi) => {
      if (weight === null || weight === NaN || weight === ''){
        return false;
      }

      if (height === null || height === NaN || height === ''){
        return false;
      }

      if (bmi === null || bmi === NaN || bmi === ''){
        return false;
      }
      
      db.transaction(
        (tx) => {
          tx.executeSql("insert into BMICalculator (weight, height, bmi, bmiDate) values (?, ?, ?, julianday('now'))", [weight, height, bmi]);
          tx.executeSql("select * from BMICalculator", [], (_, { rows }) =>
            console.log(JSON.stringify(rows))
          );
        }
      );

    }

    const onChangeWeight = (text) => {      
      setWeight(text);
    }

    const onChangeHeight = (text) => {
      setHeight(text);
    }

    const computeCalculation = async() => { 
      let result = 0;
    
      result = ((weigth/(height * height)) * 703)

      setCalculatedValue(result.toFixed(1));
      
      add(weigth, height, result.toFixed(2))      
      getMessage(result);      

    }

    const getMessage = (results) => {
      
      if(results < standards.Underweight){
        setMessage('(Underweight)');
      }
      else if (results >= standards.HealthyStarts && results <= standards.HealthyEnds)
      {
        setMessage('(Healthy)');
      }
      else if (results >= standards.OverweightStarts && results <= standards.OverweightEnds)
      {
        setMessage('(Overweight)');
      }
      else
      {
        setMessage('(Obese)');
      }  
    }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.toolbar}>BMI Calculator</Text>
        <ScrollView style={styles.scrollView}>
          <View style={styles.box}>
              <TextInput
                style={styles.input}
                onChangeText={onChangeWeight}
                value={weigth ? weigth : ""}
                keyboardType='numeric'
                placeholder="Weight in Pounds"
              />
              <TextInput
                style={styles.input}
                onChangeText={onChangeHeight}
                value={height ? height : ''}
                keyboardType='numeric'
                placeholder="Height in Inches"
              />
              <Pressable
                onPress={() => computeCalculation()}                   
                style={styles.Calculate}>
                <Text style={styles.btnText}>Calculate BMI</Text>
              </Pressable>
              <Text style={styles.results}>
                {calculatedValue != '' ? 'Body Mass Index is ' + calculatedValue : ''}
              </Text>
              <Text style={styles.message}> {message ? message : ''}</Text>
            {histories != null ?
            <View style={styles.bmiHistoryContainer}>
              <Text style={styles.bmigHeader}>BMI History</Text>
              {histories.map(({ id, weight, height, bmi, bmiDate }) => (
              <Text key={id} style={styles.historiItems}>{bmiDate}: {bmi} (W:{weight}, H:{height})</Text>
              ))}
            </View> 
            : ''}
          </View>        
        </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    marginHorizontal: 0,
  },
  toolbar: {
    backgroundColor: '#f4511e',
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    paddingTop: 20,
    paddingBottom: 20,
    textAlign: 'center',
  },
  input :{
    fontSize: 24,
    backgroundColor: '#ECECEC',
    padding: 5,
    marginBottom: 10,
    borderRadius: 5
  },
  Calculate :{
    backgroundColor : '#34495e',
    borderRadius: 5,
  },
  bmiHistoryContainer: {
    marginTop: 20
  },
  bmigHeader: {
    fontSize: 24,
    marginBottom: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  box: {
    margin: 15,
  },
  results: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 80 
  },
  message: {
    textAlign: 'center',
    fontSize: 28
  },
  historiItems: {
    fontSize: 20
  }
});
