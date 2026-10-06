/**
 * Notification text (GDD §8: optional alerts for arrivals). Never reveal an outcome here (payout, cargo left,
 * reactions): the player finds out in the app.
 */
export const NOTIFICATION_TEXT = {
  channelName: 'On the road',
  arrived: (placeName: string) => ({
    title: `Pulled into ${placeName}`,
    body: "Engine's off. Come see what's left on the dock.",
  }),
  localJobDone: {
    title: 'Local run done',
    body: 'The dispatcher left your pay at the counter.',
  },
} as const;
