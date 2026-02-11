import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Migration "migration";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Use explicit migration function, mutate fields and migrate old persistent data.
(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type FileType = {
    #audio;
    #image;
    #combined;
  };

  public type Genre = {
    #pop;
    #rock;
    #jazz;
    #classical;
    #hipHop;
    #electronic;
    #other : Text;
  };

  public type AudioFile = {
    id : Text;
    title : Text;
    duration : Nat;
    size : Nat;
    uploadTimestamp : Int;
    blob : Storage.ExternalBlob;
    creator : Text;
    genre : Genre;
    isPublic : Bool;
    owner : ?Principal;
    coverImage : ?Storage.ExternalBlob;
  };

  public type Playlist = {
    id : Text;
    title : Text;
    owner : Principal;
    trackIds : List.List<Text>;
    audiusTracks : List.List<AudiusTrack>;
    creationTimestamp : Int;
  };

  public type PlaylistView = {
    id : Text;
    title : Text;
    owner : Principal;
    trackIds : [Text];
    audiusTracks : [AudiusTrack];
    creationTimestamp : Int;
  };

  public type NFTMetadata = {
    artist : Text;
    title : Text;
    description : Text;
    fileType : FileType;
    mintTimestamp : Int;
    owner : Principal;
    originalContentId : Text;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    bio : ?Text;
  };

  public type NFTRecord = {
    audioBlob : ?Storage.ExternalBlob;
    imageBlob : ?Storage.ExternalBlob;
    metadata : NFTMetadata;
  };

  public type MintNFTRequest = {
    audioBlob : ?Storage.ExternalBlob;
    imageBlob : ?Storage.ExternalBlob;
    artist : Text;
    description : Text;
    fileType : FileType;
    originalContentId : ?Text;
    title : Text;
  };

  public type MintNFTResponse = {
    #ok : Nat;
    #unauthorized;
    #invalidInput : Text;
  };

  // In-app wallet support
  public type WalletType = {
    #inAppWallet;
    #plugWallet;
    #stoicWallet;
    #oisyWallet;
  };

  public type StableCoin = {
    #usdc;
    #tusd;
    #rlusd;
    #usde;
    #usdp;
  };

  public type RevenueSplit = {
    address : Principal;
    percentage : Nat;
  };

  public type NFTParameters = {
    price : Nat;
    stableCoin : StableCoin;
    royaltyPercentage : Nat;
    revenueSplits : [RevenueSplit];
  };

  public type NFTRecordWithParams = {
    audioBlob : ?Storage.ExternalBlob;
    imageBlob : ?Storage.ExternalBlob;
    metadata : NFTMetadata;
    params : NFTParameters;
  };

  public type MintNFTWithParamsRequest = {
    audioBlob : ?Storage.ExternalBlob;
    imageBlob : ?Storage.ExternalBlob;
    artist : Text;
    description : Text;
    fileType : FileType;
    originalContentId : ?Text;
    title : Text;
    params : NFTParameters;
  };

  public type AudiusTrack = {
    id : Text;
    title : Text;
    artist : Text;
    artworkUrl : Text;
    streamUrl : Text;
  };

  // Storage maps
  let audioFiles = Map.empty<Text, AudioFile>();
  let playlists = Map.empty<Text, Playlist>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  let nftRecords = Map.empty<Nat, NFTRecord>();
  var nftCounter : Nat = 0;

  let nftRecordsWithParams = Map.empty<Nat, NFTRecordWithParams>();
  var nftWithParamsCounter : Nat = 0;

  // ===== USER PROFILE MANAGEMENT =====

  // Get caller's own profile - requires user authentication
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // Save caller's own profile - requires user authentication
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Get another user's profile - requires authentication and ownership check
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    // Users can view their own profile, admins can view any profile
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ===== NFT MINTING WITH PARAMETERS =====

  // NFT mint with params (ICP DIP-721) - requires user authentication
  public shared ({ caller }) func mintNFTwithParams(request : MintNFTWithParamsRequest) : async MintNFTResponse {
    // Authorization: Only authenticated users can mint NFTs
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };

    // Validate input
    if (request.title == "") {
      return #invalidInput("Title cannot be empty");
    };
    if (request.artist == "") {
      return #invalidInput("Artist cannot be empty");
    };

    switch (request.fileType) {
      case (#audio) {
        if (request.audioBlob == null) {
          return #invalidInput("Audio blob required for audio NFT");
        };
      };
      case (#image) {
        if (request.imageBlob == null) {
          return #invalidInput("Image blob required for image NFT");
        };
      };
      case (#combined) {
        if (request.audioBlob == null or request.imageBlob == null) {
          return #invalidInput("Both audio and image blobs required for combined NFT");
        };
      };
    };

    // Validate royalty percentage
    if (request.params.royaltyPercentage > 100) {
      return #invalidInput("Royalty percentage cannot exceed 100");
    };

    // Validate revenue split percentages
    let totalPercentage = request.params.revenueSplits.foldLeft(
      0,
      func(acc : Nat, split : RevenueSplit) : Nat { acc + split.percentage },
    );

    if (totalPercentage != 100) {
      return #invalidInput("Revenue split percentages must total 100");
    };

    // Validate revenue split addresses are not empty
    if (request.params.revenueSplits.size() == 0) {
      return #invalidInput("At least one revenue split address required");
    };

    // Create NFT metadata
    let metadata : NFTMetadata = {
      artist = request.artist;
      title = request.title;
      description = request.description;
      fileType = request.fileType;
      mintTimestamp = Time.now();
      owner = caller;
      originalContentId = switch (request.originalContentId) {
        case (?id) { id };
        case (null) { "" };
      };
    };

    // Store NFT record (DIP-721 compatible)
    let record : NFTRecordWithParams = {
      audioBlob = request.audioBlob;
      imageBlob = request.imageBlob;
      metadata = metadata;
      params = request.params;
    };

    let nftId = nftWithParamsCounter;
    nftRecordsWithParams.add(nftId, record);
    nftWithParamsCounter += 1;

    #ok(nftId);
  };

  // Public query - get NFT with params by ID (no auth required - public access)
  public query func getNFTRecordWithParams(nftId : Nat) : async ?NFTRecordWithParams {
    nftRecordsWithParams.get(nftId);
  };

  // Public query - get all NFT with params records (no auth required - public access)
  public query func getAllNFTRecordsWithParams() : async [NFTRecordWithParams] {
    nftRecordsWithParams.values().toArray();
  };

  // Get NFTs owned by caller - requires user authentication
  public query ({ caller }) func getCallerNFTRecordsWithParams() : async [NFTRecordWithParams] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their NFTs");
    };

    nftRecordsWithParams.values()
      .filter(func(record : NFTRecordWithParams) : Bool { record.metadata.owner == caller })
      .toArray();
  };

  // ===== LEGACY NFT METHODS (WITHOUT PARAMS) =====

  // Old NFT mint method - requires user authentication
  public shared ({ caller }) func mintNFT(request : MintNFTRequest) : async MintNFTResponse {
    // Authorization: Only authenticated users can mint NFTs
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };

    // Validate input
    if (request.title == "") {
      return #invalidInput("Title cannot be empty");
    };
    if (request.artist == "") {
      return #invalidInput("Artist cannot be empty");
    };

    // Validate file type matches provided blobs
    switch (request.fileType) {
      case (#audio) {
        if (request.audioBlob == null) {
          return #invalidInput("Audio blob required for audio NFT");
        };
      };
      case (#image) {
        if (request.imageBlob == null) {
          return #invalidInput("Image blob required for image NFT");
        };
      };
      case (#combined) {
        if (request.audioBlob == null or request.imageBlob == null) {
          return #invalidInput("Both audio and image blobs required for combined NFT");
        };
      };
    };

    // Create NFT metadata
    let metadata : NFTMetadata = {
      artist = request.artist;
      title = request.title;
      description = request.description;
      fileType = request.fileType;
      mintTimestamp = Time.now();
      owner = caller;
      originalContentId = switch (request.originalContentId) {
        case (?id) { id };
        case (null) { "" };
      };
    };

    // Create NFT record
    let nftRecord : NFTRecord = {
      audioBlob = request.audioBlob;
      imageBlob = request.imageBlob;
      metadata = metadata;
    };

    // Store NFT record
    let nftId = nftCounter;
    nftRecords.add(nftId, nftRecord);
    nftCounter += 1;

    #ok(nftId);
  };

  // Public query - legacy get NFT by id (no auth required - public access)
  public query func getNFTRecord(nftId : Nat) : async ?NFTRecord {
    nftRecords.get(nftId);
  };

  // Public query - legacy get all NFTs without params (no auth required - public access)
  public query func getAllNFTRecords() : async [NFTRecord] {
    nftRecords.values().toArray();
  };

  func toPlaylistView(playlist : Playlist) : PlaylistView {
    {
      id = playlist.id;
      title = playlist.title;
      owner = playlist.owner;
      trackIds = playlist.trackIds.toArray();
      audiusTracks = playlist.audiusTracks.toArray();
      creationTimestamp = playlist.creationTimestamp;
    };
  };

  // Create playlist - requires user authentication
  public shared ({ caller }) func createPlaylist(id : Text, title : Text) : async PlaylistView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create playlists");
    };

    let playlistOpt = playlists.get(id);
    switch (playlistOpt) {
      case (?_) { Runtime.trap("Playlist with this ID already exists") };
      case (null) {
        let playlist : Playlist = {
          id;
          title;
          owner = caller;
          trackIds = List.empty<Text>();
          audiusTracks = List.empty<AudiusTrack>();
          creationTimestamp = Time.now();
        };
        playlists.add(id, playlist);
        toPlaylistView(playlist);
      };
    };
  };

  // Get all playlists for caller - requires user authentication
  public query ({ caller }) func getCallerPlaylists() : async [PlaylistView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their playlists");
    };

    playlists.values()
      .filter(func(p : Playlist) : Bool { p.owner == caller })
      .map(toPlaylistView)
      .toArray();
  };

  // Get specific playlist by ID - public access for viewing
  public query func getPlaylist(id : Text) : async ?PlaylistView {
    switch (playlists.get(id)) {
      case (?playlist) { ?toPlaylistView(playlist) };
      case (null) { null };
    };
  };

  // Get all playlists - public access for browsing
  public query func getAllPlaylists() : async [PlaylistView] {
    playlists.values().map(toPlaylistView).toArray();
  };

  // Update playlist title - requires user authentication and ownership
  public shared ({ caller }) func updatePlaylistTitle(id : Text, newTitle : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update playlists");
    };

    switch (playlists.get(id)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only update your own playlists");
        };
        let updatedPlaylist : Playlist = {
          playlist with title = newTitle;
        };
        playlists.add(id, updatedPlaylist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // Add track to playlist - requires user authentication and ownership
  public shared ({ caller }) func addTrackToPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        playlist.trackIds.add(trackId);
        playlists.add(playlistId, playlist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // Remove track from playlist - requires user authentication and ownership
  public shared ({ caller }) func removeTrackFromPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        let updatedTrackIds = playlist.trackIds.filter(func(id : Text) : Bool { id != trackId });
        let updatedPlaylist : Playlist = {
          playlist with trackIds = updatedTrackIds;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // Add Audius track to playlist - requires user authentication and ownership
  public shared ({ caller }) func addAudiusTrackToPlaylist(playlistId : Text, track : AudiusTrack) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        playlist.audiusTracks.add(track);
        playlists.add(playlistId, playlist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // Remove Audius track from playlist - requires user authentication and ownership
  public shared ({ caller }) func removeAudiusTrackFromPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        let updatedAudiusTracks = playlist.audiusTracks.filter(func(track : AudiusTrack) : Bool { track.id != trackId });
        let updatedPlaylist : Playlist = {
          playlist with audiusTracks = updatedAudiusTracks;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // Delete playlist - requires user authentication and ownership
  public shared ({ caller }) func deletePlaylist(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete playlists");
    };

    switch (playlists.get(id)) {
      case (?playlist) {
        // Verify ownership
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own playlists");
        };
        playlists.remove(id);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // ===== AUDIO FILE MANAGEMENT =====

  // Upload audio file - requires user authentication
  public shared ({ caller }) func uploadAudioFile(file : AudioFile) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload audio files");
    };

    // Set owner to caller
    let fileWithOwner : AudioFile = {
      file with owner = ?caller;
    };

    audioFiles.add(file.id, fileWithOwner);
    file.id;
  };

  // Get all audio files - public access
  public query func getAllAudioFiles() : async [AudioFile] {
    audioFiles.values().toArray();
  };

  // Get specific audio file - public access
  public query func getAudioFile(id : Text) : async ?AudioFile {
    audioFiles.get(id);
  };

  // Get caller's audio files - requires user authentication
  public query ({ caller }) func getCallerAudioFiles() : async [AudioFile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their audio files");
    };

    audioFiles.values()
      .filter(func(file : AudioFile) : Bool {
        switch (file.owner) {
          case (?owner) { owner == caller };
          case (null) { false };
        };
      })
      .toArray();
  };

  // Delete audio file - requires user authentication and ownership
  public shared ({ caller }) func deleteAudioFile(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete audio files");
    };

    switch (audioFiles.get(id)) {
      case (?file) {
        // Verify ownership
        switch (file.owner) {
          case (?owner) {
            if (owner != caller) {
              Runtime.trap("Unauthorized: Can only delete your own audio files");
            };
          };
          case (null) {
            Runtime.trap("Unauthorized: Cannot delete files without owner");
          };
        };
        audioFiles.remove(id);
      };
      case (null) { Runtime.trap("Audio file not found") };
    };
  };

  // ===== CANISTER INFORMATION =====

  // Get canister ID - public access
  public query func getCanisterId() : async Principal {
    getSelfPrincipal();
  };

  func getSelfPrincipal() : Principal {
    Principal.fromText("ekdk4-winsz-4tts2-4cizd-hfp73-zfced-pvkev-n3z43-earir-4t2jy-yqe");
  };
};
