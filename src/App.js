import React, {Component} from 'react';
import './css/materialize.css';
import {Preloader} from 'react-materialize';
import {Route} from 'react-router-dom';
import './App.css';
import * as Api from './BooksAPI';
import Content from './Content/Content';
import BooksTitle from './title/BooksTitle';
import OpenSearch from './Content/OpenSearch';
import BookShelf from './Content/BookShelf';
import Search from './Search/Search';

const NONE = 'none';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {    
      isFetching:true,
      searchResults:[],
      read: [],
      wantToRead: [],
      currentReading: []
    };
    
    this.shelfs = [
      {id:'currentlyReading', title:'Lendo neste momento' },
      {id:'wantToRead', title:'Quero Ler' },
      {id:'read', title:'Já Leu' },
    ]
  }

  componentDidMount() {
    Api
      .getAll()
      .then((books) => {
        this.setState((state) => {
          const read = books.filter(e => e.shelf === 'read');
          const wantToRead = books.filter(e => e.shelf === 'wantToRead');
          const currentlyReading = books.filter(e => e.shelf === 'currentlyReading');
          return {
            isFetching:!state.isFetching,
            read,
            wantToRead,
            currentlyReading
          };
        });
      });
    }

  updateShelfs = ({ currentShelf, shelfChange, updBook }) => {
    this.setState((state) => {
      const updObject = {isFetching:false};     
      const currentIdx = (state[currentShelf] || []).findIndex((b => b.id === updBook.id)); 
      if(currentIdx >= 0){
        updObject[currentShelf] = [
          ...this.state[currentShelf].slice(0,currentIdx),
          ...this.state[currentShelf].slice(currentIdx+1)
        ];
      } 

      if(shelfChange !== NONE){
        updObject[shelfChange] = [
          ...this.state[shelfChange],
          updBook
        ];
      }

      const searchIdx = state.searchResults.findIndex(b => b.id === updBook.id );
      
      if(searchIdx >=0){
        updObject.searchResults = [
          ...state.searchResults.slice(0, searchIdx),
          updBook,
          ...state.searchResults.slice(searchIdx+1),
        ];
      }

      return updObject;
    });
  }

  changeLocationBook = ({ dataset }) =>{
    if(dataset){
      this.setState({isFetching: true});
      const {id = '', shelfChange='', currentShelf=''} = dataset;        
      if(shelfChange !== currentShelf){        
        Api.update({id}, shelfChange)
           .then(res => Api.get(id))
           .then(updBook =>this.updateShelfs({currentShelf, shelfChange, updBook}));
      }else{
        this.setState({isFetching:false});
      }
    }    
  }

  complementBookInformation = (books, state) => {
    let result = [];
    if (Array.isArray(books)) {
      const localBooks = [...state.read, state.wantToRead, ...state.currentlyReading];   
      result = [...books];
      result.forEach(b => {
        const idx = localBooks.findIndex(f => f.id === b.id);
        if (idx >= 0) {
          b.shelf = localBooks[idx].shelf;
        }else{
          b.shelf = NONE;
        }
      });
    }
    return result;
  }

  changeIsFetching = () =>{
    this.setState((state) =>({
      ...state,
      isFetching: !state.isFetching
    }))
  }

  updateSearchResults = (books =[]) =>{
    this.setState((state) =>({
      ...state,
      isFetching:false,
      searchResults:this.complementBookInformation(books, state)
    }));
  }

  render() {
    const {isFetching} = this.state;       
    return ( 
      <div style={{ position:'relative' }}>
      <BooksTitle title='Meus Livros'/>
        <Preloader className="load-circle preloader-wrapper" active={isFetching} flashing />
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>          
          <Route exact path='/' render={() => (
            <Content>
              <OpenSearch />
              {this.shelfs.map((shelf, i) => (
                  <BookShelf
                    key={i}
                    title={shelf.title} 
                    books={this.state[shelf.id]} 
                    changeLocationBook={this.changeLocationBook} />))}              
            </Content>
          ) } />
          <Route path='/search' render={() =>(
            <Search
              isFetching={isFetching}
              changeIsFetching={this.changeIsFetching}
              updateSearchResults={this.updateSearchResults}
              searchResults={this.state.searchResults}                     
              changeLocationBook={this.changeLocationBook}
              />
          )} />
        </div>
      </div>      
    );
  }
}

export default App;