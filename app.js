import React from "react";
import { render } from "react-dom";

// For preparing reducers + store
import { combineReducers, createStore, applyMiddleware, compose } from "redux";
/*
 * combineReducers - combine splitted reducers into single reducing function
 * createStore - creates the redux store that holds the complete state tree of the App (single source of truth)
 * applyMiddleware - extend redux with custom functionality (eg: dispatch async actions)
    Ex:
    function logger({ getState }) {
        return next => action => {
            console.log('will dispatch', action)

            // Call the next dispatch method in the middleware chain.
            let returnValue = next(action)

            console.log('state after dispatch', getState())

            // This will likely be the action itself, unless
            // a middleware further in chain changed it.
            return returnValue
        }
    }
    let store = createStore(
        todos,
        ['Use Redux'],
        applyMiddleware(logger)
    )
 * compose - Use to apply several store enhancers in a row
 */
import thunk from "redux-thunk";
/* Dispatch asynchronous action, would receive dispatch as an argument and may call it asynchronously
 */
import createLogger from "redux-logger";
/* Tool to log Redux actions/state to the console (locally)
 * redux-devtools: Logging and time-travel debugging (locally)
 * https://blog.logrocket.com/maximizing-debuggability-with-redux-79b2ad07b64c
 */
import { routerReducer, syncHistoryWithStore } from "react-router-redux";
/* Bindings to keep react-router and redux in sync
 * routerReducer - must add reducer to store for syncing to work; stores location updates from history; nested under "routing" key if using combineReducers
 * syncHistoryWithStore - creates enchanced history from the provided history. Handles store update during a navigation event or time travel action
 */

// For syncing history with store
import { browserHistory, IndexRoute, Router, Route } from "react-router";
/* Declarative routing for React
 * browserHistory - HTML5 history API
 * Router - primary component of react router; keeps UI and URL in sync
 * Route - used to declaratively map routes to your app's component hierarchy
 * IndexRoute - for specifiying default page
 */

// For preparing routes
import { Provider } from "react-redux";
/* Official React binding for Redux
 * <Provider store>
 * connect([mapStateToProps], [mapDispatchToProps], [mergeProps], [options])
 * Provider - makes redux store available to the connect() calls in the component
    Ex:
    import { connect } from 'react-redux'
    import { showCartItem } from '../cartActions'

    class CartContainer extends PureComponent {}
    const mapStateToProps = ({ cart: { entries }, userDetail }) => ({
        entries,
        userDetail
    })
    const mapDispatchToProps = dispatch => ({
        showCartItem() {
            dispatch(showCartItem())
        }
    })
    export default connect(mapStateToProps, mapDispatchToProps)(CartContainer)
 */

//--> Store and reducer preparation
// Initial state
const preloadedState = {
  cart: {
    entries: {},
    write: {}
  }
};
// Sample reducer
const cartReducer = (state = [], action) => {
  switch (action.type) {
    case "SET_CART_ENTRIES":
      return immutableObjectMerge(state, {
        entries: action.entries
      });
    default:
      return state;
  }
};
// Combining all reducers
const reducer = combineReducers({
  cart: cartReducer,
  routing: routerReducer
});
// Create the store
/* Use this approach if store is put in a separate file
    // Configure store
    const configureStore = (preloadedState) => {
        return createStore(reducer, preloadedState, compose(applyMiddleware(thunk, createLogger()), DevTools.instrument()))
    }
    export default configureStore

    // Import configureStore
    const store = configureStore(preloadedState)
*/
const store = createStore(
  reducer,
  preloadedState,
  compose(applyMiddleware(thunk, createLogger()), DevTools.instrument())
);
//<-- Store and reducer preparation

//--> Sync history with store
const history = syncHistoryWithStore(browserHistory, store);
//<-- Sync history with store

//--> Route Component Preparation
if (typeof require.ensure !== "function") {
  require.ensure = (deps, callback) => {
    callback(require);
  };
}
const Root = ({ history, store }) => (
  <Provider store={store}>
    {/* Use this approach if routes are in a separate file
            // Base route
            <Router history={history} routes={routes(store)} />

            // Routes definition
            export default (store) => {
                const onEnter (nextState, replace) => {
                    store.getState().cart.length !==  nextState.cart.length && replace('/')
                }

                // Pass browserHistory to the Router in order to remove hash from the URL  (e.g: http://localhost:3000/#/?_k=4sbb0i)
                <Router history={browserHistory}>
                    <Route path="" component={App} onEnter={onEnter}>
                        ...
                    </Route>
                </Router>
            }

        */}

    {/* Tell the Router to use our enhanced history */}
    <Router history={history}>
      <Route path="/cart" component={App}>
        <IndexRoute
          getComponent={(location, cb) => {
            require.ensure(
              [],
              require =>
                cb(null, require("../containers/cart/CartContainer").default),
              "cartpage"
            );
          }}
        />
        <Route
          path="/(:item)"
          getComponent={(location, cb) => {
            require.ensure(
              [],
              require =>
                cb(
                  null,
                  require("../containers/cart/CartItemContainer").default
                ),
              "cartitempage"
            );
          }}
        />
      </Route>
    </Router>
  </Provider>
);
//<-- Route Component Preparation

// Finally, render root Component
render(
  <Root history={history} store={store} />,
  document.getElementById("root")
);
