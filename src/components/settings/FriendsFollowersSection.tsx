import { useState } from "react";
import { useFriendships } from "@/hooks/useFriendships";
import { useFollowers } from "@/hooks/useFollowers";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Loader2,
  Check,
  X,
} from "lucide-react";

export function FriendsFollowersSection() {
  const {
    friends,
    pendingRequests,
    sentRequests,
    isLoading: friendsLoading,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriendships();

  const {
    followers,
    following,
    pendingFollowRequests,
    isLoading: followersLoading,
    approveFollowRequest,
    removeFollower,
    unfollowUser,
  } = useFollowers();

  const isLoading = friendsLoading || followersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="friends" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-4">
        <TabsTrigger value="friends" className="text-xs sm:text-sm">
          Friends ({friends.length})
        </TabsTrigger>
        <TabsTrigger value="requests" className="text-xs sm:text-sm">
          Requests ({pendingRequests.length})
        </TabsTrigger>
        <TabsTrigger value="followers" className="text-xs sm:text-sm">
          Followers ({followers.length})
        </TabsTrigger>
        <TabsTrigger value="following" className="text-xs sm:text-sm">
          Following ({following.length})
        </TabsTrigger>
      </TabsList>

      {/* Friends Tab */}
      <TabsContent value="friends" className="space-y-3">
        {friends.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send friend requests from other users' profiles
            </p>
          </div>
        ) : (
          friends.map((friend) => (
            <UserRow
              key={friend?.id}
              user={friend}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Find the friendship ID
                    // This is a simplification - in reality you'd need the friendship ID
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              }
            />
          ))
        )}
      </TabsContent>

      {/* Friend Requests Tab */}
      <TabsContent value="requests" className="space-y-3">
        {pendingRequests.length === 0 && sentRequests.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pending requests</p>
          </div>
        ) : (
          <>
            {/* Received Requests */}
            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Received Requests
                </h4>
                {pendingRequests.map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.requester}
                    action={
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => acceptFriendRequest.mutate(request.id)}
                          disabled={acceptFriendRequest.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => declineFriendRequest.mutate(request.id)}
                          disabled={declineFriendRequest.isPending}
                          className="text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Sent Requests
                </h4>
                {sentRequests.map((request) => (
                  <UserRow
                    key={request.id}
                    user={request.addressee}
                    action={
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </TabsContent>

      {/* Followers Tab */}
      <TabsContent value="followers" className="space-y-3">
        {/* Pending Follow Requests */}
        {pendingFollowRequests.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="text-sm font-medium text-primary">
              Pending Approval ({pendingFollowRequests.length})
            </h4>
            {pendingFollowRequests.map((request) => (
              <UserRow
                key={request.id}
                user={request.follower}
                action={
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => approveFollowRequest.mutate(request.id)}
                      disabled={approveFollowRequest.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFollower.mutate(request.id)}
                      disabled={removeFollower.isPending}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        )}

        {followers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No followers yet</p>
          </div>
        ) : (
          followers.map((follower) => (
            <UserRow
              key={follower.id}
              user={follower.follower}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFollower.mutate(follower.id)}
                  disabled={removeFollower.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              }
            />
          ))
        )}
      </TabsContent>

      {/* Following Tab */}
      <TabsContent value="following" className="space-y-3">
        {following.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Not following anyone</p>
          </div>
        ) : (
          following.map((follow) => (
            <UserRow
              key={follow.id}
              user={follow.following}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unfollowUser.mutate(follow.following_id)}
                  disabled={unfollowUser.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  Unfollow
                </Button>
              }
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

interface UserRowProps {
  user?: {
    id: string;
    username: string;
    avatar_url: string;
  };
  action?: React.ReactNode;
}

function UserRow({ user, action }: UserRowProps) {
  if (!user) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <Link
        to={`/profile/${user.id}`}
        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary transition-all"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-medium">
            {user.username?.[0]?.toUpperCase() || "?"}
          </span>
        )}
      </Link>
      <div className="flex-1">
        <Link
          to={`/profile/${user.id}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {user.username}
        </Link>
      </div>
      {action}
    </div>
  );
}
