import React, {Component} from 'react';

export default class inboxFolder extends Component {
  renderPlayer(track){
    return (
      <folder
        key={track.id}
        clientId={client_id}
        resolveUrl={track.permalink_url} />
      );
    }

  render() {
    const { name, icon, counts, active} = this.props;
    return(
        <div className="inboxFolder">
        <div className="foldeName">{name}</div>
        <Timer
          duration={duration}
          className="timer"
          soundCloudAudio={soundCloudAudio}
          currentTime={currentTime} />
        <div className="track-info">
          <h2 className="track-title">{track && track.title}</h2>
          <h3 className="track-user">{track && track.user && track.user.username}</h3>
        </div>
        <Progress
          className="progress-container"
          innerClassName="progress"
          soundCloudAudio={soundCloudAudio}
          value={currentProgress} />
      </div>
  )
  }
}