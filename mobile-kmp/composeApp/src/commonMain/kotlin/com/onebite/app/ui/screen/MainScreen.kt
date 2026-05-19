package com.onebite.app.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import com.onebite.app.ui.screen.tab.HomeTab
import com.onebite.app.ui.screen.tab.MapTab
import com.onebite.app.ui.screen.tab.ProfileTab

data class TabItem(
    val title: String,
    val icon: ImageVector
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onSplitClick: (Long) -> Unit,
    onCreateSplit: () -> Unit,
    onMySplits: () -> Unit,
    onParticipatedSplits: () -> Unit,
    onLogout: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) }

    val tabs = listOf(
        TabItem("홈", Icons.Default.Home),
        TabItem("지도", Icons.Default.LocationOn),
        TabItem("프로필", Icons.Default.Person)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "한입",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            )
        },
        bottomBar = {
            NavigationBar {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        icon = { Icon(tab.icon, contentDescription = tab.title) },
                        label = { Text(tab.title) },
                        selected = selectedTab == index,
                        onClick = { selectedTab = index }
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onCreateSplit,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "상품 등록")
            }
        }
    ) { paddingValues ->
        Box(modifier = Modifier.padding(paddingValues)) {
            when (selectedTab) {
                0 -> HomeTab(onSplitClick = onSplitClick)
                1 -> MapTab(onSplitClick = onSplitClick)
                2 -> ProfileTab(
                    onMySplits = onMySplits,
                    onParticipatedSplits = onParticipatedSplits,
                    onLogout = onLogout,
                )
            }
        }
    }
}
