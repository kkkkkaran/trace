import React, { Component } from 'react'
import {connect} from 'react-redux';
import QRCode from 'qrcode.react'
import { Link } from 'react-router-dom'
import { withScriptjs, withGoogleMap, GoogleMap, Marker } from "react-google-maps"

import {
  Container,
  Button
} from 'reactstrap';

class View extends Component {

  constructor(props) {
    super(props);

    // TODO: move this to Redux store
    this.state = {
      name: "",
      description: "",
      latitude: "",
      longitude: "",
      versionCreationDate: "",
      versions: [],
      certifications: [],
      id: "",
      customDataJson: ""
    };
  }

  componentWillReceiveProps(nextProps){
    this.fetchProduct(nextProps);
  }

  componentDidMount(){
    this.fetchProduct(this.props);
  }

  fetchProduct(props){
    this.props.passageInstance.getProductById(String(props.match.params.productId).valueOf(), props.match.params.versionId ? String(props.match.params.versionId).valueOf() : "latest")
      .then((result) => {

        this.setState({
          name: result[0],
          description: result[1],
          latitude: parseFloat(result[2]),
          longitude: parseFloat(result[3]),
          versionCreationDate: new Date(result[4].c * 1000).toString(),
          versions: result[5],
          id: props.match.params.productId,
          certifications: []
        })

        const certificationsArray = result[6];
        certificationsArray.map((certificationId) => {
          this.props.passageInstance.getCertificationById(String(certificationId).valueOf())
            .then((certificationResult) => {
              const certification = {
                name: certificationResult[0],
                imageUrl: certificationResult[1],
                id: certificationId,
              }
              this.setState({certifications: [...this.state.certifications, certification]})
            });
        });
      })
      .catch((error) => {
        this.setState({
          name: "",
          description: "",
          latitude: "",
          longitude: "",
          versionCreationDate: "",
          versions: [],
          certifications: [],
          id: "",
        })
      })


    this.props.passageInstance.getProductCustomDataById(String(props.match.params.productId).valueOf(), props.match.params.versionId ? String(props.match.params.versionId).valueOf() : "latest")
      .then((result) => {
        this.setState({
          customDataJson: result
        })
      })
      .catch((error) => {
        this.setState({
          customDataJson: ""
        })
      })
  }

  render() {
    
    const versionsList = this.state.versions.map((version, index) => {
      return (
        <li key={index}>
          <Link to={`/products/${this.props.match.params.productId}/versions/${version}`}>Version {index + 1} ({version})</Link>
        </li>
      )
    }).reverse()

    const certificationsList = this.state.certifications.map((certification, index) => {
      return (
        <li key={index}>
          <div>{certification.name}</div>
          <img style={{maxWidth:"100px"}} src={certification.imageUrl}/>
        </li>
      )
    })

    const myLat = this.state.latitude;
    const myLng = this.state.longitude;

    const MyMapComponent = withScriptjs(withGoogleMap((props) =>
      <GoogleMap
        defaultZoom={8}
        defaultCenter={{ lat: myLat, lng: myLng }}
      >
        {<Marker position={{ lat: myLat, lng: myLng }} />}
      </GoogleMap>
    ))

    const customData = this.state.customDataJson ? JSON.parse(this.state.customDataJson) : {};

    return (
      <div>
        <div style={{display:"flex"}}>
          <div style={{flex: 1}}>
            <h1>{this.state.name}</h1>
            <p>Description du produit : {this.state.description}</p>
            <p>Date de création de la version : {this.state.versionCreationDate}</p>
            {
              Object.keys(customData).map(key => <p>{key} : {customData[key]}</p>)
            }
            { this.props.match.params.versionId && this.state.versions && this.state.versions.length > 0 && this.props.match.params.versionId.toString() != this.state.versions.slice(-1)[0].toString() ?
                <Link to={"/products/" + this.props.match.params.productId}>
                  <Button color="info">
                    Voir la dernière version
                  </Button>
                </Link>
              :
                <Link to={"/products/" + this.props.match.params.productId + "/update"}>
                  <Button color="success">
                    Mettre à jour
                  </Button>
                </Link>
            }
          </div>
          <div style={{flex:1, textAlign:"right"}}>
            <QRCode value={this.props.match.params.productId}/>
            <p>
              <small>
                ProductID: 
                <pre>{this.state.id}</pre>
              </small>
            </p>
          </div>
        </div>
        <hr/>
        
        <h2>Emplacement (à cette version)</h2>
        <div>
          {myLat && myLng ? 
            <div>
              <pre>{myLat}, {myLng}</pre>
              <MyMapComponent
                googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyDvLv2v8JgbUGp4tEM7wRmDB0fXbO_Em4I&libraries=geometry,drawing,places"
                loadingElement={<div style={{ height: `100%` }} />}
                containerElement={<div style={{ height: `400px` }} />}
                mapElement={<div style={{ height: `100%` }} />}
              />
            </div>
            :
            <p>Impossible d'afficher l'emplacement géographique.</p>
          }
        </div>

        <hr/>

        <h2>Certifications</h2>
        <ul>
          {certificationsList}
        </ul>

        <hr/>

        <h2>Historique</h2>
        <ul>
          {versionsList}
        </ul>

        <hr/>

        
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    passageInstance: state.temporaryGodReducer.passageInstance
  };
}

export default connect(mapStateToProps)(View);
