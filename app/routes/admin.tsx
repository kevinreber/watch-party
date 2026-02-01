import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import type { MetaFunction } from 'react-router';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { generateAdminMetaTags } from '~/utils/seo';

export const meta: MetaFunction = () => {
  return generateAdminMetaTags();
};

type TabType = 'overview' | 'users' | 'rooms' | 'activity';
type TopUserMetric = 'watchTime' | 'messages' | 'partiesHosted' | 'reactions' | 'streak';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | null>(null);
  const [topUsersMetric, setTopUsersMetric] = useState<TopUserMetric>('watchTime');

  // Data queries
  const dashboardStats = useQuery(api.admin.getDashboardStats);
  const userGrowthChart = useQuery(api.admin.getUserGrowthChart);
  const activityChart = useQuery(api.admin.getActivityChart);
  const allUsers = useQuery(api.admin.getAllUsers, { limit: 20 });
  const topUsers = useQuery(api.admin.getTopUsers, { metric: topUsersMetric, limit: 10 });
  const roomAnalytics = useQuery(api.admin.getRoomAnalytics);
  const recentActivity = useQuery(api.admin.getRecentActivity, { limit: 30 });
  const badgeDistribution = useQuery(api.admin.getBadgeDistribution);
  const engagementMetrics = useQuery(api.admin.getEngagementMetrics);
  const searchResults = useQuery(api.admin.searchUsersAdmin, { query: searchQuery });
  const userDetail = useQuery(api.admin.getUserDetail, selectedUserId ? { userId: selectedUserId } : 'skip');

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;

    return `${Math.floor(seconds / 86400)}d`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string): string => {
    const icons: Record<string, string> = {
      watching: '📺',
      joined_room: '🚪',
      created_room: '🏠',
      started_party: '🎉',
      added_friend: '👥',
      earned_badge: '🏆',
      created_playlist: '📋',
      joined_group: '👨‍👩‍👧‍👦',
    };

    return icons[type] || '📌';
  };

  const renderOverviewTab = () => (
    <div style={styles.tabContent}>
      {/* Stats Cards */}
      {dashboardStats && (
        <>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.overview.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
              <div style={styles.statSubtext}>+{dashboardStats.userGrowth.newUsersThisWeek} this week</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.overview.totalRooms}</div>
              <div style={styles.statLabel}>Total Rooms</div>
              <div style={styles.statSubtext}>+{dashboardStats.activity.roomsCreatedThisWeek} this week</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.overview.totalMessages}</div>
              <div style={styles.statLabel}>Total Messages</div>
              <div style={styles.statSubtext}>{dashboardStats.activity.messagesThisWeek} this week</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.activity.activeUsersToday}</div>
              <div style={styles.statLabel}>Active Today</div>
              <div style={styles.statSubtext}>{dashboardStats.activity.activeUsersThisWeek} this week</div>
            </div>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.engagement.totalWatchTimeHours}h</div>
              <div style={styles.statLabel}>Total Watch Time</div>
              <div style={styles.statSubtext}>Avg {dashboardStats.engagement.avgWatchTimePerUser}m/user</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.engagement.totalVideosWatched}</div>
              <div style={styles.statLabel}>Videos Watched</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.overview.totalBadgesAwarded}</div>
              <div style={styles.statLabel}>Badges Awarded</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{dashboardStats.overview.totalFriendships}</div>
              <div style={styles.statLabel}>Friendships</div>
            </div>
          </div>
        </>
      )}

      {/* User Growth Chart */}
      {userGrowthChart && userGrowthChart.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>User Growth (Last 30 Days)</h3>
          <div style={styles.chartContainer}>
            {userGrowthChart.map((day) => {
              const maxCount = Math.max(...userGrowthChart.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;

              return (
                <div key={day.date} style={styles.chartBar}>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${Math.max(height, 2)}%`,
                    }}
                    title={`${day.date}: ${day.count} new users`}
                  />
                </div>
              );
            })}
          </div>
          <div style={styles.chartLabels}>
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      )}

      {/* Activity Chart */}
      {activityChart && activityChart.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>Activity (Last 14 Days)</h3>
          <div style={styles.legendRow}>
            <span style={{ ...styles.legend, color: '#8B5CF6' }}>● Messages</span>
            <span style={{ ...styles.legend, color: '#10B981' }}>● Rooms Created</span>
            <span style={{ ...styles.legend, color: '#F59E0B' }}>● Videos Watched</span>
          </div>
          <div style={styles.chartContainer}>
            {activityChart.map((day) => {
              const maxVal = Math.max(
                ...activityChart.flatMap((d) => [d.messages, d.roomsCreated * 10, d.videosWatched]),
                1
              );

              return (
                <div key={day.date} style={styles.chartBarGroup}>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${(day.messages / maxVal) * 100}%`,
                      backgroundColor: '#8B5CF6',
                    }}
                    title={`Messages: ${day.messages}`}
                  />
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${((day.roomsCreated * 10) / maxVal) * 100}%`,
                      backgroundColor: '#10B981',
                    }}
                    title={`Rooms: ${day.roomsCreated}`}
                  />
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${(day.videosWatched / maxVal) * 100}%`,
                      backgroundColor: '#F59E0B',
                    }}
                    title={`Videos: ${day.videosWatched}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Users Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Top Users</h3>
          <div style={styles.metricTabs}>
            {(['watchTime', 'messages', 'partiesHosted', 'reactions'] as TopUserMetric[]).map((metric) => (
              <button
                key={metric}
                onClick={() => setTopUsersMetric(metric)}
                style={{
                  ...styles.metricTab,
                  ...(topUsersMetric === metric ? styles.metricTabActive : {}),
                }}
              >
                {metric === 'watchTime'
                  ? '⏱️ Watch Time'
                  : metric === 'messages'
                    ? '💬 Messages'
                    : metric === 'partiesHosted'
                      ? '🎉 Parties'
                      : '😄 Reactions'}
              </button>
            ))}
          </div>
        </div>
        {topUsers && (
          <div style={styles.topUsersList}>
            {topUsers.map((user) => (
              <div key={user._id} style={styles.topUserItem}>
                <span style={styles.topUserRank}>#{user.rank}</span>
                <div style={{ ...styles.avatar, backgroundColor: user.avatarColor }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} style={styles.avatarImage} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <Link to={`/profile/${user.username}`} style={styles.topUserName}>
                  {user.username}
                </Link>
                <span style={styles.topUserValue}>
                  {topUsersMetric === 'watchTime' ? formatDuration(user.value) : user.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge Distribution */}
      {badgeDistribution && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Badge Distribution</h3>
          <div style={styles.badgeStats}>
            <div style={styles.badgeCategoryGrid}>
              {badgeDistribution.byCategory.map((cat) => (
                <div key={cat.category} style={styles.badgeCategoryCard}>
                  <div style={styles.badgeCategoryCount}>{cat.count}</div>
                  <div style={styles.badgeCategoryName}>{cat.category}</div>
                </div>
              ))}
            </div>
            <div style={styles.badgeList}>
              {badgeDistribution.badges.slice(0, 10).map((badge) => (
                <div key={badge.name} style={styles.badgeItem}>
                  <span>{badge.name}</span>
                  <span style={styles.badgeCount}>{badge.count} awarded</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderUsersTab = () => (
    <div style={styles.tabContent}>
      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search users by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Search Results */}
      {searchQuery.length >= 2 && searchResults && (
        <div style={styles.searchResults}>
          <h3 style={styles.sectionTitle}>Search Results ({searchResults.length})</h3>
          {searchResults.map((user) => (
            <div
              key={user._id}
              style={{
                ...styles.userRow,
                ...(selectedUserId === user._id ? styles.userRowSelected : {}),
              }}
              onClick={() => setSelectedUserId(user._id)}
            >
              <div style={{ ...styles.avatar, backgroundColor: user.avatarColor }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} style={styles.avatarImage} />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div style={styles.userInfo}>
                <div style={styles.userName}>{user.username}</div>
                <div style={styles.userEmail}>{user.email || 'No email'}</div>
              </div>
              <div style={styles.userStats}>
                <span>⏱️ {formatDuration(user.stats.totalWatchTime)}</span>
                <span>💬 {user.stats.messagesSent}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Users List */}
      {allUsers && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>All Users ({allUsers.total})</h3>
          <div style={styles.usersList}>
            {allUsers.users.map((user) => (
              <div
                key={user._id}
                style={{
                  ...styles.userRow,
                  ...(selectedUserId === user._id ? styles.userRowSelected : {}),
                }}
                onClick={() => setSelectedUserId(user._id)}
              >
                <div style={{ ...styles.avatar, backgroundColor: user.avatarColor }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} style={styles.avatarImage} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{user.username}</div>
                  <div style={styles.userMeta}>
                    Joined {new Date(user.createdAt).toLocaleDateString()} • {user.badgeCount} badges •{' '}
                    {user.roomsOwned} rooms
                  </div>
                </div>
                <div style={styles.userStats}>
                  <span>⏱️ {formatDuration(user.stats.totalWatchTime)}</span>
                  <span>💬 {user.stats.messagesSent}</span>
                  <span>🎉 {user.stats.partiesHosted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Detail Panel */}
      {selectedUserId && userDetail && (
        <div style={styles.userDetailPanel}>
          <div style={styles.userDetailHeader}>
            <div style={{ ...styles.avatarLarge, backgroundColor: userDetail.user.avatarColor }}>
              {userDetail.user.avatar ? (
                <img src={userDetail.user.avatar} alt={userDetail.user.username} style={styles.avatarImage} />
              ) : (
                userDetail.user.username.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 style={styles.userDetailName}>{userDetail.user.username}</h3>
              <p style={styles.userDetailEmail}>{userDetail.user.email || 'No email'}</p>
              <p style={styles.userDetailJoined}>Joined {userDetail.user.createdAtFormatted}</p>
            </div>
            <button onClick={() => setSelectedUserId(null)} style={styles.closeButton}>
              ✕
            </button>
          </div>

          <div style={styles.userDetailStats}>
            <div style={styles.detailStatItem}>
              <div style={styles.detailStatValue}>{formatDuration(userDetail.user.stats.totalWatchTime)}</div>
              <div style={styles.detailStatLabel}>Watch Time</div>
            </div>
            <div style={styles.detailStatItem}>
              <div style={styles.detailStatValue}>{userDetail.user.stats.videosWatched}</div>
              <div style={styles.detailStatLabel}>Videos</div>
            </div>
            <div style={styles.detailStatItem}>
              <div style={styles.detailStatValue}>{userDetail.user.stats.messagesSent}</div>
              <div style={styles.detailStatLabel}>Messages</div>
            </div>
            <div style={styles.detailStatItem}>
              <div style={styles.detailStatValue}>{userDetail.user.stats.partiesHosted}</div>
              <div style={styles.detailStatLabel}>Parties</div>
            </div>
          </div>

          <div style={styles.userDetailSection}>
            <h4>Badges ({userDetail.badges.length})</h4>
            {userDetail.badges.length > 0 ? (
              <div style={styles.badgeGrid}>
                {userDetail.badges.map((badge) => (
                  <div key={badge._id} style={styles.userBadge} title={badge.description}>
                    {badge.icon} {badge.name}
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noData}>No badges earned</p>
            )}
          </div>

          {userDetail.watchStreak && (
            <div style={styles.userDetailSection}>
              <h4>Watch Streak</h4>
              <p>
                Current: {userDetail.watchStreak.currentStreak} days | Longest:{' '}
                {userDetail.watchStreak.longestStreak} days
              </p>
            </div>
          )}

          {userDetail.userLevel && (
            <div style={styles.userDetailSection}>
              <h4>Level</h4>
              <p>
                Level {userDetail.userLevel.level} ({userDetail.userLevel.title}) - {userDetail.userLevel.totalXp} XP
              </p>
            </div>
          )}

          <div style={styles.userDetailSection}>
            <h4>Summary</h4>
            <p>
              {userDetail.friendsCount} friends • {userDetail.roomsOwned} rooms owned • {userDetail.playlistsCount}{' '}
              playlists
            </p>
          </div>

          <Link to={`/profile/${userDetail.user.username}`} style={styles.viewProfileLink}>
            View Public Profile →
          </Link>
        </div>
      )}
    </div>
  );

  const renderRoomsTab = () => (
    <div style={styles.tabContent}>
      {roomAnalytics && (
        <>
          {/* Room Stats */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{roomAnalytics.summary.totalRooms}</div>
              <div style={styles.statLabel}>Total Rooms</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{roomAnalytics.summary.publicRooms}</div>
              <div style={styles.statLabel}>Public Rooms</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{roomAnalytics.summary.privateRooms}</div>
              <div style={styles.statLabel}>Private Rooms</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{roomAnalytics.summary.roomsWithVideo}</div>
              <div style={styles.statLabel}>Currently Playing</div>
            </div>
          </div>

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Room List</h3>
            <div style={styles.roomsList}>
              <div style={styles.roomHeader}>
                <span style={styles.roomHeaderName}>Room Name</span>
                <span style={styles.roomHeaderOwner}>Owner</span>
                <span style={styles.roomHeaderMembers}>Members</span>
                <span style={styles.roomHeaderActive}>Active</span>
                <span style={styles.roomHeaderMessages}>Messages</span>
              </div>
              {roomAnalytics.rooms.map((room) => (
                <div key={room._id} style={styles.roomRow}>
                  <span style={styles.roomName}>
                    {room.isPrivate ? '🔒' : '🌐'} {room.name}
                    {room.hasVideo && ' 📺'}
                  </span>
                  <span style={styles.roomOwner}>{room.ownerName}</span>
                  <span style={styles.roomMembers}>{room.totalMembers}</span>
                  <span style={styles.roomActive}>{room.activeMembers}</span>
                  <span style={styles.roomMessages}>{room.totalMessages}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div style={styles.tabContent}>
      {/* Engagement Metrics */}
      {engagementMetrics && engagementMetrics.length > 0 && (
        <div style={styles.chartSection}>
          <h3 style={styles.chartTitle}>Engagement (Last 14 Days)</h3>
          <div style={styles.legendRow}>
            <span style={{ ...styles.legend, color: '#8B5CF6' }}>● Active Users</span>
            <span style={{ ...styles.legend, color: '#10B981' }}>● Watch Time (hrs)</span>
          </div>
          <div style={styles.chartContainer}>
            {engagementMetrics.map((day) => {
              const maxVal = Math.max(
                ...engagementMetrics.flatMap((d) => [d.activeUsers * 2, d.watchTimeHours]),
                1
              );

              return (
                <div key={day.date} style={styles.chartBarGroup}>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${((day.activeUsers * 2) / maxVal) * 100}%`,
                      backgroundColor: '#8B5CF6',
                    }}
                    title={`Active Users: ${day.activeUsers}`}
                  />
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${(day.watchTimeHours / maxVal) * 100}%`,
                      backgroundColor: '#10B981',
                    }}
                    title={`Watch Time: ${day.watchTimeHours}h`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Activity</h3>
        {recentActivity && (
          <div style={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity._id} style={styles.activityItem}>
                <div style={styles.activityIcon}>{getActivityIcon(activity.type)}</div>
                <div style={{ ...styles.avatar, backgroundColor: activity.avatarColor, width: 32, height: 32 }}>
                  {activity.avatar ? (
                    <img src={activity.avatar} alt={activity.username} style={styles.avatarImage} />
                  ) : (
                    activity.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div style={styles.activityContent}>
                  <span style={styles.activityUser}>{activity.username}</span>
                  <span style={styles.activityText}>
                    {activity.type === 'watching' && `is watching ${activity.videoName || 'a video'}`}
                    {activity.type === 'joined_room' && `joined ${activity.roomName || 'a room'}`}
                    {activity.type === 'created_room' && `created ${activity.roomName || 'a room'}`}
                    {activity.type === 'started_party' && `started a party in ${activity.roomName || 'a room'}`}
                    {activity.type === 'added_friend' && `became friends with ${activity.friendName || 'someone'}`}
                    {activity.type === 'earned_badge' && `earned the "${activity.badgeName}" badge`}
                    {activity.type === 'created_playlist' && `created playlist "${activity.playlistName}"`}
                    {activity.type === 'joined_group' && `joined ${activity.groupName || 'a group'}`}
                  </span>
                </div>
                <div style={styles.activityTime}>{formatDate(activity.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Admin Dashboard</h1>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.tabs}>
          {(['overview', 'users', 'rooms', 'activity'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
            >
              {tab === 'overview' && '📊 '}
              {tab === 'users' && '👥 '}
              {tab === 'rooms' && '🏠 '}
              {tab === 'activity' && '📈 '}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'rooms' && renderRoomsTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    color: '#fff',
    padding: '20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#8B5CF6',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '16px',
    padding: '8px 0',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #333',
    paddingBottom: '16px',
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
    color: '#fff',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statSubtext: {
    fontSize: '12px',
    color: '#10B981',
    marginTop: '8px',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  chartSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
  },
  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  legendRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    fontSize: '12px',
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: '120px',
    padding: '8px 0',
  },
  chartBar: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
  },
  chartBarGroup: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '1px',
  },
  chartBarFill: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: '2px 2px 0 0',
    minHeight: '2px',
    transition: 'height 0.3s',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#666',
    marginTop: '8px',
  },
  metricTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  metricTab: {
    padding: '6px 12px',
    backgroundColor: '#262626',
    border: 'none',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  metricTabActive: {
    backgroundColor: '#8B5CF6',
    color: '#fff',
  },
  topUsersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  topUserItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    backgroundColor: '#262626',
    borderRadius: '8px',
  },
  topUserRank: {
    width: '32px',
    fontSize: '14px',
    color: '#888',
  },
  topUserName: {
    flex: 1,
    color: '#fff',
    textDecoration: 'none',
  },
  topUserValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarLarge: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  badgeStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  badgeCategoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
  },
  badgeCategoryCard: {
    backgroundColor: '#262626',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  },
  badgeCategoryCount: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  badgeCategoryName: {
    fontSize: '12px',
    color: '#888',
    textTransform: 'capitalize',
  },
  badgeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  badgeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#262626',
    borderRadius: '6px',
    fontSize: '14px',
  },
  badgeCount: {
    color: '#888',
    fontSize: '12px',
  },
  searchContainer: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  },
  searchResults: {
    backgroundColor: '#1a1a1a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#262626',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  userRowSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.5)',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '2px',
  },
  userEmail: {
    fontSize: '12px',
    color: '#888',
  },
  userMeta: {
    fontSize: '12px',
    color: '#888',
  },
  userStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#888',
  },
  userDetailPanel: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    width: '360px',
    maxHeight: 'calc(100vh - 100px)',
    backgroundColor: '#1a1a1a',
    borderRadius: '16px',
    padding: '20px',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    zIndex: 100,
  },
  userDetailHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
    position: 'relative',
  },
  userDetailName: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  userDetailEmail: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#888',
  },
  userDetailJoined: {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
  },
  userDetailStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '20px',
  },
  detailStatItem: {
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: '#262626',
    borderRadius: '8px',
  },
  detailStatValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  detailStatLabel: {
    fontSize: '10px',
    color: '#888',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  userDetailSection: {
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #333',
  },
  badgeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  userBadge: {
    padding: '6px 10px',
    backgroundColor: '#262626',
    borderRadius: '6px',
    fontSize: '12px',
  },
  noData: {
    color: '#666',
    fontSize: '13px',
    margin: '8px 0 0 0',
  },
  viewProfileLink: {
    display: 'block',
    textAlign: 'center',
    padding: '12px',
    backgroundColor: '#8B5CF6',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '500',
    marginTop: '16px',
  },
  roomsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  roomHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 80px 80px 80px',
    gap: '12px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase',
    borderBottom: '1px solid #333',
  },
  roomHeaderName: {},
  roomHeaderOwner: {},
  roomHeaderMembers: { textAlign: 'center' },
  roomHeaderActive: { textAlign: 'center' },
  roomHeaderMessages: { textAlign: 'center' },
  roomRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 80px 80px 80px',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#262626',
    borderRadius: '8px',
    fontSize: '14px',
    alignItems: 'center',
  },
  roomName: {
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roomOwner: {
    color: '#888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roomMembers: { textAlign: 'center' },
  roomActive: { textAlign: 'center', color: '#10B981' },
  roomMessages: { textAlign: 'center', color: '#888' },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#262626',
    borderRadius: '8px',
  },
  activityIcon: {
    fontSize: '20px',
    width: '28px',
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityUser: {
    fontWeight: '500',
    marginRight: '6px',
  },
  activityText: {
    color: '#888',
  },
  activityTime: {
    fontSize: '12px',
    color: '#666',
    whiteSpace: 'nowrap',
  },
};
