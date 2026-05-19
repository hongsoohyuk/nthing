package com.onebite.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.onebite.app.auth.AuthManager
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.ui.screen.CreateSplitScreen
import com.onebite.app.ui.screen.LoginScreen
import com.onebite.app.ui.screen.MainScreen
import com.onebite.app.ui.screen.SplitDetailScreen
import com.onebite.app.ui.screen.SplitListScreen

object Routes {
    const val LOGIN = "login"
    const val MAIN = "main"
    const val SPLIT_DETAIL = "split/{splitId}"
    const val CREATE_SPLIT = "create_split"
    const val MY_SPLITS = "my_splits"
    const val PARTICIPATED_SPLITS = "participated_splits"

    fun splitDetail(splitId: Long) = "split/$splitId"
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    // 저장된 토큰이 있으면 자동 로그인 → MAIN부터 시작
    val startDestination = if (AuthManager.tryAutoLogin()) Routes.MAIN else Routes.LOGIN

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.MAIN) {
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.MAIN) {
            MainScreen(
                onSplitClick = { splitId ->
                    navController.navigate(Routes.splitDetail(splitId))
                },
                onCreateSplit = {
                    navController.navigate(Routes.CREATE_SPLIT)
                },
                onMySplits = { navController.navigate(Routes.MY_SPLITS) },
                onParticipatedSplits = { navController.navigate(Routes.PARTICIPATED_SPLITS) },
                onLogout = {
                    navController.navigate(Routes.LOGIN) {
                        popUpTo(Routes.MAIN) { inclusive = true }
                    }
                }
            )
        }

        composable(Routes.MY_SPLITS) {
            SplitListScreen(
                title = "내 나눠사기",
                emptyTitle = "등록한 나눠사기가 없어요",
                emptySubtitle = "홈에서 상품을 등록해보세요",
                loader = { OneBiteApi.getMySplits() },
                onBack = { navController.popBackStack() },
                onSplitClick = { splitId -> navController.navigate(Routes.splitDetail(splitId)) }
            )
        }

        composable(Routes.PARTICIPATED_SPLITS) {
            SplitListScreen(
                title = "참여한 나눠사기",
                emptyTitle = "참여한 나눠사기가 없어요",
                emptySubtitle = "지도에서 근처 나눠사기를 찾아보세요",
                loader = { OneBiteApi.getParticipatedSplits() },
                onBack = { navController.popBackStack() },
                onSplitClick = { splitId -> navController.navigate(Routes.splitDetail(splitId)) }
            )
        }

        composable(Routes.SPLIT_DETAIL) { backStackEntry ->
            val splitId = backStackEntry.arguments?.getString("splitId")?.toLongOrNull() ?: 0L
            SplitDetailScreen(
                splitId = splitId,
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.CREATE_SPLIT) {
            CreateSplitScreen(
                onBack = { navController.popBackStack() },
                onCreated = { navController.popBackStack() }
            )
        }
    }
}
