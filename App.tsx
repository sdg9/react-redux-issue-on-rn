/**
 * This app demonstrates undesired behavior in react-redux 9.x where mapStateToProps in a parent
 * component blocks state updates to child components.
 *
 * Essentially I have 2 reducers, one to update a date to the current timestamp and another to increment a counter.
 * I provide buttons to dispatch these actions.
 *
 * I then have two components each with their own mapStateToProps, one as a child of the other.
 * As of react-redux 9.x, the parent component's mapStateToProps blocks state updates to the child component if the child component's mapStateToProps isn't a subset of the parents.
 *
 * I could NOT reproduce on web with the same scenario https://codepen.io/steveng9/pen/QWPmLao
 *
 * This is related to https://github.com/reduxjs/react-redux/issues/2150
 */
import React from 'react';
import {Button, Text, View, TextStyle} from 'react-native';
import {Provider, connect, Dispatch} from 'react-redux';
import {configureStore, Action} from '@reduxjs/toolkit';

// ========= REDUX SETUP =========

// Actions
const ADD = 'ADD';
const DATE = 'DATE';

// Action types
interface AddAction extends Action<typeof ADD> {}
interface DateAction extends Action<typeof DATE> {
  payload: {date: number};
}

// Reducer states
interface DateState {
  date: number | null;
}

interface CounterState {
  count: number;
}

// Reducers
const dateReducer = (state: DateState = {date: null}, action: DateAction) => {
  switch (action.type) {
    case DATE:
      return {
        ...state,
        date: action.payload.date,
      };
    default:
      return state;
  }
};

const counterReducer = (
  state: CounterState = {count: 0},
  action: AddAction,
) => {
  switch (action.type) {
    case ADD:
      return {
        ...state,
        count: state.count + 1,
      };
    default:
      return state;
  }
};

// Store
const store = configureStore({
  reducer: {
    counter: counterReducer,
    dates: dateReducer,
  },
});

// ======== COMPONENTS =========
interface CounterProps {
  count: number;
  date: number | null;
  dispatch: Dispatch<AddAction | DateAction>;
}

class CounterRaw extends React.PureComponent<CounterProps> {
  handleIncrement = () => {
    this.props.dispatch({type: ADD});
  };

  handleDate = () => {
    this.props.dispatch({type: DATE, payload: {date: Date.now()}});
  };

  render() {
    return (
      <View style={{paddingVertical: 20}}>
        <Text>Counter Value: {this.props.count}</Text>
        <Text>date Value: {this.props.date}</Text>
      </View>
    );
  }
}

class ButtonsRaw extends React.PureComponent<CounterProps> {
  handleIncrement = () => {
    this.props.dispatch({type: ADD});
  };

  handleDate = () => {
    this.props.dispatch({type: DATE, payload: {date: Date.now()}});
  };

  render() {
    return (
      <View>
        <Button title="Update Date" onPress={this.handleDate} />
        <View style={{height: 20}} />
        <Button title="Increment Counter" onPress={this.handleIncrement} />
      </View>
    );
  }
}

const mapStateToProps = (state: {counter: CounterState; dates: DateState}) => {
  return {count: state.counter.count, date: state.dates.date};
};

const mapDispatchToProps = (dispatch: Dispatch<AddAction | DateAction>) => ({
  dispatch,
});

const Buttons = connect(null, mapDispatchToProps)(ButtonsRaw);
const Counter = connect(mapStateToProps, mapDispatchToProps)(CounterRaw);

class Container extends React.PureComponent {
  render() {
    return this.props.children;
  }
}

const mapStateToPropsBreaking = (_state: any) => ({});

const ContainerBad = connect(mapStateToPropsBreaking, null)(Container);

const mapStateToPropsNonBlocking1 = (state: {counter: CounterState}) => ({
  count: state.counter.count,
});

const ContainerNonBlocking1 = connect(
  mapStateToPropsNonBlocking1,
  null,
)(Container);

const mapStateToPropsNonBlocking2 = (state: any) => ({state});

const ContainerNonBlocking2 = connect(
  mapStateToPropsNonBlocking2,
  null,
)(Container);

class App extends React.Component {
  render() {
    const $H1: TextStyle = {fontSize: 20};
    return (
      <Provider store={store}>
        <Buttons />
        <Text style={$H1}>=Expected=</Text>
        <View>
          <Text>
            I don't have a parent blocking state updates so I should behave as
            expected
          </Text>
          <Counter />
        </View>

        <Text style={$H1}>=Undesired behavior with react-redux 9.x=</Text>
        <ContainerBad>
          <Text>All redux state updates blocked</Text>
          <Counter />
        </ContainerBad>

        <Text style={$H1}>=Partially working in 9.x=</Text>
        <ContainerNonBlocking1>
          <Text>
            I'm inconsistent, if date updates first I don't see it, but once
            count updates I rerender with count or date changes
          </Text>
          <Counter />
        </ContainerNonBlocking1>

        <Text style={$H1}>=Poor workaround for 9.x?=</Text>
        <ContainerNonBlocking2>
          <Text>I see all state changes</Text>
          <Counter />
        </ContainerNonBlocking2>
      </Provider>
    );
  }
}

export default App;
