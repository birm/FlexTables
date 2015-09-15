var React = require('react');

var FixedDataTable = require('fixed-data-table');

var Table = FixedDataTable.Table;
var Column = FixedDataTable.Column;
var jQuery = require('jquery');
var ColumnGroup = FixedDataTable.ColumnGroup;
var Reflux = require('reflux')

var Actions = require('./actions/Actions.jsx')

var ConfigStore = require('./stores/ConfigStore.jsx');
var DataStore = require('./stores/DataStore.jsx');
var HistoryStore = require('./stores/HistoryStore.jsx');



var PAGEID=0;
var PERPAGE=100;
var isColumnResizing;
var COLUMNWIDTHS={};

var init = function(){
    Actions.init();
    var pagingParams = "&perPage="+PERPAGE +"&pageId="+PAGEID;
    var url = "index.php/getData?pathState=0"+pagingParams;
    console.log(url);
    Actions.rowClick(url);
}

init();

var WIDTH = 1200;


var PaginationPanel = React.createClass({
  render: function(){
    var self = this;
    var pageId = this.props.pagingData.pageId;
    var endPageId = this.props.pagingData.endPageId;
    var pagesArray = Array.apply(null, Array(endPageId)).map(Number.prototype.valueOf,0);
    var Pages = pagesArray.map(function(o,i){
      var className="pageNumber";
      if(pageId == i){
        className += " activePage";

      }
      return(
        <div className={className} onClick={function(){
          self.props.handlePaging(i);
        }}>{i}</div>
      )
    });
    for(var i=0; i<endPageId; i++){
           
    }
    return(
      <div>{Pages}</div>
    );
  }
});

var BackButton = React.createClass({
  render: function(){
    if(this.props.pathState){
        return(
          <div>Back</div>
        )
    } else {
      return(
        <div />
      )
    }
  }
});

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};
var InitTable = React.createClass({
  listenables: Actions,
  getInitialState: function(){
    return {pathState: 0, sortDir: null, sortBy: null, pageId:0};
  },
  onData: function(){
    var self = this;
    var data = DataStore.getData();
    //console.log(data)
    if(data)
      self.setState({data: data});
  },
  componentDidMount: function(){
    var self = this;
    self.unsubscribe = DataStore.listen(self.onData)


  },
  getPage: function(i, index){
    var self  = this;
    var pathState  = self.state.pathState;
    var config = ConfigStore.getConfig()["path"];
    self.setState({data: null});
    params = "";
    var history = HistoryStore.getHistory();
    console.log(history);
   
    params = history[history.length - 1];
    if(!params){
      params = "";
    }
    var pagingParams = "&perPage="+PERPAGE +"&pageId="+i;
  
    var reqParams = config[pathState]["params"];
    
    Actions.rowClick("index.php/getData?pathState="+ pathState+ "&" + reqParams + "="+ params[reqParams]+pagingParams, params);
    //self.setState({pageId: i});
  },
  rowGetter: function(i){
    //console.log(this.state.data[i])
    return (this.state.data[i]);
  },
  nextPath: function(event, index){

    var self  = this; 
    self.setState({data: null, pageId:0});

    var pathState  = self.state.pathState;
    var config = ConfigStore.getConfig()["path"];

    pathState++;
    params = self.state.data[index];
    var row = self.state.data[index];
    var pagingParams = "&perPage="+PERPAGE +"&pageId="+0;
  
    var reqParams = config[pathState]["params"];
    var urlParams = "";    
    for(var i in reqParams){
      var param = reqParams[i];
      var urlParam = "&" + param+"="+row[param];
      urlParams+=urlParam;
    }
    
    //console.log("..........");
    var url = "index.php/getData?pathState="+ pathState + urlParams + pagingParams;
    console.log(url);
    Actions.rowClick(url, params);
    this.setState({pathState: pathState});
  },
  _onBack: function(){
    var params = (HistoryStore.popRecent());
    var pathState = this.state.pathState -1;
    var urlparams = "";
    if(params){
      for(var i in params){
        urlparams = "&" + i + "=" + params[i];
      }
    }
    Actions.rowClick("index.php/getData?pathState="+ pathState + urlparams);

    this.setState({pathState: pathState});
  },
  _sortRowsBy: function(cellDataKey){
    var self = this;
    var data = self.state.data;
    var sortBy = cellDataKey;
    if(sortBy == this.state.sortBy){
        sortDir = this.state.sortDir === SortTypes.ASC ? SortTypes.DESC : SortTypes.ASC;
        
    } else {
        sortDir = SortTypes.DESC;
    }


    data.sort(function(a,b){
        var sortVal = 0;
        if(a[sortBy] > b[sortBy]){
            sortVal = 1;
        }
        if(a[sortBy] < b[sortBy]){
            sortVal = -1;
        }
    
        if(sortDir === SortTypes.DESC){
            sortVal =  sortVal * -1;
        }


        return sortVal;

    });
    this.setState({data: data, sortBy: sortBy, sortDir: sortDir});
  },
   
  renderHeader: function(label, cellDataKey){
    //console.log(label);
    return(
        <div>
        <a onClick={this._sortRowsBy.bind(null,cellDataKey)}>{label}</a>
        </div>
    );
  },
  _onColumnResizeEndCallback(newColumnWidth, dataKey) {
    console.log(newColumnWidth);
    console.log(dataKey);
    COLUMNWIDTHS[dataKey] = newColumnWidth;
    console.log(COLUMNWIDTHS);
    isColumnResizing = false;
    this.forceUpdate(); // don't do this, use a store and put into this.state!
  },

  render: function(){


    var self = this;
    var config = ConfigStore.getConfig();  
    var sortDirArrow = '';
    
    if (this.state.sortDir !== null){
      sortDirArrow = this.state.sortDir === SortTypes.DESC ? ' ↓' : ' ↑';
    }
    

     
    if(self.state.data){
      var pagingData = DataStore.getPagingData();
      //console.log(pagingData);
      var data = self.state.data;
      var keys = [];
      for(var i in data[0]){
        keys.push(i)
      }
      var nColumns = keys.length;
      var Columns = keys.map(function(column){
        //console.log(self.renderHeader);
        //COLUMNWIDTHS[column]=WIDTH/(keys.length);
        console.log(COLUMNWIDTHS[column]);
        return(
          <Column
            label={column + " "+(self.state.sortBy === column ? sortDirArrow : '')}
            width={COLUMNWIDTHS[column] || WIDTH/(keys.length)}
            dataKey={column }
            className="tabCols"
            flexGrow={2}
            isResizable={true}
            headerRenderer={self.renderHeader}      
          />
        )
      });
   
      return(
      <div>
        <h1>{config.title}</h1>
        <h4>{config["path"][self.state.pathState]["name"]}</h4>   
        <div onClick={self._onBack} className="backLink">  
          <BackButton pathState={self.state.pathState} />
        </div>

        <Table
        rowHeight={50}
        rowGetter={self.rowGetter}
        rowsCount={self.state.data.length}
        width={WIDTH}
        height={400}
        headerHeight={50}
        isColumnResizing={isColumnResizing}
        onColumnResizeEndCallback={this._onColumnResizeEndCallback}

        overflowX={"auto"}
        onRowClick={self.nextPath}>
          {Columns}
        </Table>
        <PaginationPanel handlePaging={self.getPage.bind(this)}pagingData={pagingData} />
      </div>
    )
    } else {
      return(
        <h4>Loading...</h4>
      )
    }

  }
});

var App = React.createClass({
  
  render: function(){
    var config = ConfigStore.getConfig();
    //console.log(config);
    return(
      <div id="whoosh">
        <div id="whooshTable">
          <InitTable/>
        </div>
      </div>
    )
  }
})

React.render(
  <App />,
  document.getElementById('app')
);
