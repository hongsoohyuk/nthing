package com.onebite.server.split

data class SplitCreatedEvent(val splitId: Long)
data class SplitJoinedEvent(val splitId: Long, val joinerUserId: Long)
data class SplitMatchedEvent(val splitId: Long)
data class SplitCancelledEvent(val splitId: Long)
data class SplitCompletedEvent(val splitId: Long)
