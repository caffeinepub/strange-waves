import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

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
    albumId : ?Text;
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

  public type TransferNFTResponse = {
    #ok;
    #notFound;
    #unauthorized;
    #alreadyListed;
  };

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

  // View type returned by queries — includes tokenId but is NOT stored
  public type NFTRecordWithParamsView = {
    tokenId : Nat;
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

  // ===== DIP-721 MARKETPLACE TYPES =====

  public type NFTListing = {
    tokenId : Nat;
    seller : Principal;
    priceE8s : Nat;
    listedAt : Int;
    title : Text;
    description : Text;
    fileType : FileType;
  };

  public type BuyNFTResponse = {
    #ok;
    #notListed;
    #unauthorized;
    #notFound;
    #cannotBuyOwn;
  };

  public type ListNFTResponse = {
    #ok;
    #notFound;
    #unauthorized;
    #alreadyListed;
  };

  public type AlbumTier = {
    name : Text;
    price : Nat;
    supply : Nat;
    description : Text;
  };

  public type Album = {
    id : Text;
    name : Text;
    description : Text;
    theme : Text;
    trackIds : List.List<Text>;
    listenerTier : AlbumTier;
    collectorTier : AlbumTier;
    investorTier : AlbumTier;
    creationTimestamp : Int;
  };

  public type AlbumView = {
    id : Text;
    name : Text;
    description : Text;
    theme : Text;
    trackIds : [Text];
    listenerTier : AlbumTier;
    collectorTier : AlbumTier;
    investorTier : AlbumTier;
    creationTimestamp : Int;
  };

  public type AlbumInput = {
    id : Text;
    name : Text;
    description : Text;
    theme : Text;
    listenerTier : AlbumTier;
    collectorTier : AlbumTier;
    investorTier : AlbumTier;
  };

  public type AudiusTrack = {
    id : Text;
    title : Text;
    artist : Text;
    artworkUrl : Text;
    streamUrl : Text;
  };

  let albums = Map.empty<Text, Album>();
  let audioFiles = Map.empty<Text, AudioFile>();
  let playlists = Map.empty<Text, Playlist>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  let nftRecords = Map.empty<Nat, NFTRecord>();
  var nftCounter : Nat = 0;
  let nftRecordsWithParams = Map.empty<Nat, NFTRecordWithParams>();
  var nftWithParamsCounter : Nat = 0;

  // Mutable ownership map: tokenId -> current owner (for DIP-721 transfers)
  var nftOwnership = Map.empty<Nat, Principal>();

  // Marketplace listings: tokenId -> NFTListing
  var nftListings = Map.empty<Nat, NFTListing>();

  // Convert Album to AlbumView (immutable)
  func toAlbumView(album : Album) : AlbumView {
    {
      album with
      trackIds = album.trackIds.toArray();
    };
  };

  // ===== USER PROFILE MANAGEMENT =====

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ===== NFT MINTING WITH PARAMETERS =====

  public shared ({ caller }) func mintNFTwithParams(request : MintNFTWithParamsRequest) : async MintNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };

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

    if (request.params.royaltyPercentage > 50) {
      return #invalidInput("Royalty percentage cannot exceed 50");
    };

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

    let nftId = nftWithParamsCounter;
    let record : NFTRecordWithParams = {
      audioBlob = request.audioBlob;
      imageBlob = request.imageBlob;
      metadata = metadata;
      params = request.params;
    };
    nftRecordsWithParams.add(nftId, record);
    // Record initial ownership in the ownership map
    nftOwnership.add(nftId, caller);
    nftWithParamsCounter += 1;

    #ok(nftId);
  };

  public query func getNFTRecordWithParams(nftId : Nat) : async ?NFTRecordWithParamsView {
    switch (nftRecordsWithParams.get(nftId)) {
      case (?record) { ?{ record with tokenId = nftId } };
      case (null) { null };
    };
  };

  public query func getAllNFTRecordsWithParams() : async [NFTRecordWithParamsView] {
    nftRecordsWithParams.entries()
      .map(func(entry : (Nat, NFTRecordWithParams)) : NFTRecordWithParamsView {
        { entry.1 with tokenId = entry.0 }
      })
      .toArray();
  };

  public query ({ caller }) func getCallerNFTRecordsWithParams() : async [NFTRecordWithParamsView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their NFTs");
    };
    // Check ownership map first, fall back to metadata owner
    nftRecordsWithParams.entries()
      .filter(func(entry : (Nat, NFTRecordWithParams)) : Bool {
        let tokenId = entry.0;
        let record = entry.1;
        switch (nftOwnership.get(tokenId)) {
          case (?owner) { owner == caller };
          case (null) { record.metadata.owner == caller };
        };
      })
      .map(func(entry : (Nat, NFTRecordWithParams)) : NFTRecordWithParamsView {
        { entry.1 with tokenId = entry.0 }
      })
      .toArray();
  };

  // ===== DIP-721 TRANSFER & MARKETPLACE =====

  /// Returns the current owner of an NFT (checks ownership map first)
  public query func ownerOf(tokenId : Nat) : async ?Principal {
    switch (nftOwnership.get(tokenId)) {
      case (?owner) { ?owner };
      case (null) {
        switch (nftRecordsWithParams.get(tokenId)) {
          case (?record) { ?record.metadata.owner };
          case (null) { null };
        };
      };
    };
  };

  /// Transfer an NFT to another principal (DIP-721 transferFrom)
  public shared ({ caller }) func transferNFT(tokenId : Nat, to : Principal) : async TransferNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };
    // Verify caller is current owner
    let currentOwner = switch (nftOwnership.get(tokenId)) {
      case (?owner) { owner };
      case (null) {
        switch (nftRecordsWithParams.get(tokenId)) {
          case (?record) { record.metadata.owner };
          case (null) { return #notFound };
        };
      };
    };
    if (currentOwner != caller) {
      return #unauthorized;
    };
    // Cannot transfer if listed for sale
    switch (nftListings.get(tokenId)) {
      case (?_) { return #alreadyListed };
      case (null) {};
    };
    nftOwnership.add(tokenId, to);
    #ok;
  };

  /// List an NFT for sale on the marketplace
  public shared ({ caller }) func listNFTForSale(tokenId : Nat, priceE8s : Nat) : async ListNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };
    let record = switch (nftRecordsWithParams.get(tokenId)) {
      case (?r) { r };
      case (null) { return #notFound };
    };
    let currentOwner = switch (nftOwnership.get(tokenId)) {
      case (?owner) { owner };
      case (null) { record.metadata.owner };
    };
    if (currentOwner != caller) {
      return #unauthorized;
    };
    switch (nftListings.get(tokenId)) {
      case (?_) { return #alreadyListed };
      case (null) {};
    };
    let listing : NFTListing = {
      tokenId;
      seller = caller;
      priceE8s;
      listedAt = Time.now();
      title = record.metadata.title;
      description = record.metadata.description;
      fileType = record.metadata.fileType;
    };
    nftListings.add(tokenId, listing);
    #ok;
  };

  /// Remove an NFT listing from the marketplace
  public shared ({ caller }) func delistNFT(tokenId : Nat) : async TransferNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };
    switch (nftListings.get(tokenId)) {
      case (?listing) {
        if (listing.seller != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          return #unauthorized;
        };
        nftListings.remove(tokenId);
        #ok;
      };
      case (null) { #notFound };
    };
  };

  /// Get all active marketplace listings
  public query func getListings() : async [NFTListing] {
    nftListings.values().toArray();
  };

  /// Buy a listed NFT — transfers ownership to buyer
  /// Note: actual ICP token transfer requires ledger canister integration;
  /// this records ownership transfer on-chain within this canister.
  public shared ({ caller }) func buyNFT(tokenId : Nat) : async BuyNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };
    let listing = switch (nftListings.get(tokenId)) {
      case (?l) { l };
      case (null) { return #notListed };
    };
    if (listing.seller == caller) {
      return #cannotBuyOwn;
    };
    // Transfer ownership
    nftOwnership.add(tokenId, caller);
    // Remove listing
    nftListings.remove(tokenId);
    #ok;
  };

  // ===== LEGACY NFT METHODS (WITHOUT PARAMS) =====

  public shared ({ caller }) func mintNFT(request : MintNFTRequest) : async MintNFTResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #unauthorized;
    };

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

    let nftRecord : NFTRecord = {
      audioBlob = request.audioBlob;
      imageBlob = request.imageBlob;
      metadata = metadata;
    };

    let nftId = nftCounter;
    nftRecords.add(nftId, nftRecord);
    nftCounter += 1;

    #ok(nftId);
  };

  public query func getNFTRecord(nftId : Nat) : async ?NFTRecord {
    nftRecords.get(nftId);
  };

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

  public query ({ caller }) func getCallerPlaylists() : async [PlaylistView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their playlists");
    };

    playlists.values()
      .filter(func(p : Playlist) : Bool { p.owner == caller })
      .map(toPlaylistView)
      .toArray();
  };

  public query func getPlaylist(id : Text) : async ?PlaylistView {
    switch (playlists.get(id)) {
      case (?playlist) { ?toPlaylistView(playlist) };
      case (null) { null };
    };
  };

  public query func getAllPlaylists() : async [PlaylistView] {
    playlists.values().map(toPlaylistView).toArray();
  };

  public shared ({ caller }) func updatePlaylistTitle(id : Text, newTitle : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update playlists");
    };

    switch (playlists.get(id)) {
      case (?playlist) {
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

  public shared ({ caller }) func addTrackToPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        playlist.trackIds.add(trackId);
        playlists.add(playlistId, playlist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  public shared ({ caller }) func removeTrackFromPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
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

  public shared ({ caller }) func addAudiusTrackToPlaylist(playlistId : Text, track : AudiusTrack) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only modify your own playlists");
        };
        playlist.audiusTracks.add(track);
        playlists.add(playlistId, playlist);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  public shared ({ caller }) func removeAudiusTrackFromPlaylist(playlistId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can modify playlists");
    };

    switch (playlists.get(playlistId)) {
      case (?playlist) {
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

  public shared ({ caller }) func deletePlaylist(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete playlists");
    };

    switch (playlists.get(id)) {
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Can only delete your own playlists");
        };
        playlists.remove(id);
      };
      case (null) { Runtime.trap("Playlist not found") };
    };
  };

  // ===== AUDIO FILE MANAGEMENT =====

  public shared ({ caller }) func uploadAudioFile(file : AudioFile) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload audio files");
    };

    let fileWithOwner : AudioFile = {
      file with owner = ?caller;
    };

    audioFiles.add(file.id, fileWithOwner);
    file.id;
  };

  public shared ({ caller }) func uploadTrackWithAlbum(file : AudioFile, albumId : ?Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload audio files");
    };

    let fileWithOwner : AudioFile = {
      file with albumId;
      owner = ?caller;
    };

    audioFiles.add(file.id, fileWithOwner);
    file.id;
  };

  public query func getAllAudioFiles() : async [AudioFile] {
    audioFiles.values().toArray();
  };

  public query func getAudioFilesByAlbum(albumId : Text) : async [AudioFile] {
    audioFiles.values()
      .filter(func(file) { switch (file.albumId) { case (?id) { id == albumId }; case (null) { false } } })
      .toArray();
  };

  public query func getAudioFile(id : Text) : async ?AudioFile {
    audioFiles.get(id);
  };

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

  public shared ({ caller }) func deleteAudioFile(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete audio files");
    };

    switch (audioFiles.get(id)) {
      case (?file) {
        switch (file.owner) {
          case (?owner) {
            if (owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Can only delete your own audio files");
            };
          };
          case (null) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Cannot delete files without owner");
            };
          };
        };
        audioFiles.remove(id);
      };
      case (null) { Runtime.trap("Audio file not found") };
    };
  };

  // ===== ALBUM MANAGEMENT =====

  public shared ({ caller }) func createAlbum(input : AlbumInput) : async AlbumView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create albums");
    };

    let existingAlbum = albums.get(input.id);
    switch (existingAlbum) {
      case (?_) { Runtime.trap("Album with this ID already exists") };
      case (null) {
        let newAlbum : Album = {
          id = input.id;
          name = input.name;
          description = input.description;
          theme = input.theme;
          trackIds = List.empty<Text>();
          listenerTier = input.listenerTier;
          collectorTier = input.collectorTier;
          investorTier = input.investorTier;
          creationTimestamp = Time.now();
        };
        albums.add(input.id, newAlbum);
        toAlbumView(newAlbum);
      };
    };
  };

  public query func getAlbum(id : Text) : async ?AlbumView {
    switch (albums.get(id)) {
      case (?album) { ?toAlbumView(album) };
      case (null) { null };
    };
  };

  public query func listAlbums() : async [AlbumView] {
    albums.values().map(func(album) { toAlbumView(album) }).toArray();
  };

  public shared ({ caller }) func updateAlbum(id : Text, input : AlbumInput) : async AlbumView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update albums");
    };

    switch (albums.get(id)) {
      case (?existing) {
        let updatedAlbum : Album = {
          existing with
          name = input.name;
          description = input.description;
          theme = input.theme;
          listenerTier = input.listenerTier;
          collectorTier = input.collectorTier;
          investorTier = input.investorTier;
        };
        albums.add(id, updatedAlbum);
        toAlbumView(updatedAlbum);
      };
      case (null) { Runtime.trap("Album not found") };
    };
  };

  public shared ({ caller }) func deleteAlbum(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete albums");
    };

    switch (albums.get(id)) {
      case (?_) {
        albums.remove(id);
      };
      case (null) { Runtime.trap("Album not found") };
    };
  };

  public shared ({ caller }) func addTrackToAlbum(albumId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add tracks to albums");
    };

    switch (albums.get(albumId)) {
      case (?album) {
        album.trackIds.add(trackId);
        albums.add(albumId, album);
      };
      case (null) { Runtime.trap("Album not found") };
    };
  };

  public query func getCanisterId() : async Principal {
    getSelfPrincipal();
  };

  func getSelfPrincipal() : Principal {
    Principal.fromText("ekdk4-winsz-4tts2-4cizd-hfp73-zfced-pvkev-n3z43-earir-4t2jy-yqe");
  };
};
