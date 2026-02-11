import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Storage "blob-storage/Storage";

module {
  // Migration for adding persistent Audius track storage in playlists

  type FileType = {
    #audio;
    #image;
    #combined;
  };

  type AudioFile = {
    blob : Storage.ExternalBlob;
    coverImage : ?Storage.ExternalBlob;
    creator : Text;
    duration : Nat;
    genre : {
      #pop;
      #rock;
      #jazz;
      #classical;
      #hipHop;
      #electronic;
      #other : Text;
    };
    id : Text;
    isPublic : Bool;
    owner : ?Principal;
    size : Nat;
    title : Text;
    uploadTimestamp : Int;
  };

  type AudiusTrack = {
    id : Text;
    title : Text;
    artist : Text;
    artworkUrl : Text;
    streamUrl : Text;
  };

  type NFTRecord = {
    audioBlob : ?Storage.ExternalBlob;
    imageBlob : ?Storage.ExternalBlob;
    metadata : {
      artist : Text;
      description : Text;
      fileType : FileType;
      mintTimestamp : Int;
      owner : Principal;
      originalContentId : Text;
      title : Text;
    };
  };

  type OldPlaylist = {
    id : Text;
    title : Text;
    owner : Principal;
    trackIds : List.List<Text>;
    creationTimestamp : Int;
  };

  type NewPlaylist = {
    id : Text;
    title : Text;
    owner : Principal;
    trackIds : List.List<Text>;
    audiusTracks : List.List<AudiusTrack>;
    creationTimestamp : Int;
  };

  type OldActor = {
    audioFiles : Map.Map<Text, AudioFile>;
    playlists : Map.Map<Text, OldPlaylist>;
    nftRecords : Map.Map<Nat, NFTRecord>;
    nftCounter : Nat;
  };

  type NewActor = {
    audioFiles : Map.Map<Text, AudioFile>;
    playlists : Map.Map<Text, NewPlaylist>;
    nftRecords : Map.Map<Nat, NFTRecord>;
    nftCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newPlaylists = old.playlists.map<Text, OldPlaylist, NewPlaylist>(
      func(_id, playlist) {
        {
          playlist with audiusTracks = List.empty<AudiusTrack>()
        };
      }
    );

    {
      old with
      playlists = newPlaylists
    };
  };
};
