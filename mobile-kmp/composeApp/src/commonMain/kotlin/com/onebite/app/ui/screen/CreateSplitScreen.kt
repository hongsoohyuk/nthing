package com.onebite.app.ui.screen

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.onebite.app.data.api.OneBiteApi
import com.onebite.app.data.model.CreateSplitRequest
import com.onebite.app.location.DeviceLocation
import com.onebite.app.location.LocationProvider
import com.onebite.app.media.ImagePicker
import com.onebite.app.media.PickedImage
import com.onebite.app.ui.component.formatPrice
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

private fun Double.coordStr(): String {
    val rounded = (this * 10000).roundToInt()
    val intPart = rounded / 10000
    val fracPart = abs(rounded % 10000)
    return "$intPart.${fracPart.toString().padStart(4, '0')}"
}

// CreateSplitScreen.kt - 나눠사기 등록 화면
//
// React 비교:
//   function CreateSplitPage() {
//     const [form, setForm] = useState({ productName: '', ... })
//     const mutation = useMutation(createSplit)
//     const handleSubmit = () => mutation.mutate(form)
//     return <form onSubmit={handleSubmit}>...</form>
//   }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateSplitScreen(
    onBack: () -> Unit,
    onCreated: () -> Unit
) {
    // 폼 상태 (React의 useState 여러 개와 동일)
    var productName by remember { mutableStateOf("") }
    var totalPrice by remember { mutableStateOf("") }
    var totalQty by remember { mutableStateOf("") }
    var splitCount by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }

    var pickedImage by remember { mutableStateOf<PickedImage?>(null) }
    var showImageMenu by remember { mutableStateOf(false) }

    var currentLocation by remember { mutableStateOf<DeviceLocation?>(null) }
    var isLocating by remember { mutableStateOf(false) }

    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val scrollState = rememberScrollState()

    // 화면 진입 시 자동으로 GPS 좌표 캡처 (lat/lng 0.0 방지)
    LaunchedEffect(Unit) {
        isLocating = true
        val granted = LocationProvider.requestPermission()
        if (granted) {
            val location = LocationProvider.getCurrentLocation()
            if (location != null) {
                currentLocation = location
            }
        }
        isLocating = false
    }

    // 폼 유효성 검사
    val totalPriceInt = totalPrice.toIntOrNull()
    val totalQtyInt = totalQty.toIntOrNull()
    val splitCountInt = splitCount.toIntOrNull()

    val isFormValid = productName.isNotBlank()
            && totalPriceInt != null && totalPriceInt > 0
            && totalQtyInt != null && totalQtyInt > 0
            && splitCountInt != null && splitCountInt >= 2
            && address.isNotBlank()

    // 인당 가격 미리보기
    val pricePerPerson = if (totalPriceInt != null && splitCountInt != null && splitCountInt > 0) {
        totalPriceInt / splitCountInt
    } else null

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("나눠사기 등록") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "뒤로가기"
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 24.dp)
                .verticalScroll(scrollState),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // 사진 첨부
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .clickable { showImageMenu = true },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    if (pickedImage != null) {
                        // 선택된 이미지 정보 표시
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = pickedImage!!.fileName,
                                fontSize = 14.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${pickedImage!!.bytes.size / 1024}KB · 탭하여 변경",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "사진 추가",
                                fontSize = 16.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "탭하여 카메라/갤러리 선택",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            }

            // 이미지 선택 메뉴
            if (showImageMenu) {
                AlertDialog(
                    onDismissRequest = { showImageMenu = false },
                    title = { Text("사진 추가") },
                    text = {
                        Column {
                            TextButton(
                                onClick = {
                                    showImageMenu = false
                                    coroutineScope.launch {
                                        pickedImage = ImagePicker.captureFromCamera()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null)
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("카메라로 촬영")
                            }
                            TextButton(
                                onClick = {
                                    showImageMenu = false
                                    coroutineScope.launch {
                                        pickedImage = ImagePicker.pickFromGallery()
                                    }
                                },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Share, contentDescription = null)
                                Spacer(modifier = Modifier.width(12.dp))
                                Text("갤러리에서 선택")
                            }
                        }
                    },
                    confirmButton = {},
                    dismissButton = {
                        TextButton(onClick = { showImageMenu = false }) {
                            Text("취소")
                        }
                    }
                )
            }

            // 상품명
            OutlinedTextField(
                value = productName,
                onValueChange = { productName = it },
                label = { Text("상품명") },
                placeholder = { Text("예: 두쫀쿠 4개입") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            // 전체 가격
            OutlinedTextField(
                value = totalPrice,
                onValueChange = { totalPrice = it.filter { c -> c.isDigit() } },
                label = { Text("전체 가격 (원)") },
                placeholder = { Text("예: 20000") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )

            // 전체 수량
            OutlinedTextField(
                value = totalQty,
                onValueChange = { totalQty = it.filter { c -> c.isDigit() } },
                label = { Text("전체 수량") },
                placeholder = { Text("예: 4") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )

            // 나눌 인원
            OutlinedTextField(
                value = splitCount,
                onValueChange = { splitCount = it.filter { c -> c.isDigit() } },
                label = { Text("나눌 인원 (2명 이상)") },
                placeholder = { Text("예: 2") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
            )

            // 주소
            OutlinedTextField(
                value = address,
                onValueChange = { address = it },
                label = { Text("주소") },
                placeholder = { Text("예: 서울 강남구 역삼동") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                trailingIcon = {
                    IconButton(
                        onClick = {
                            coroutineScope.launch {
                                isLocating = true
                                val granted = LocationProvider.requestPermission()
                                if (granted) {
                                    val location = LocationProvider.getCurrentLocation()
                                    if (location != null) {
                                        currentLocation = location
                                        snackbarHostState.showSnackbar(
                                            "위치 캡처 완료 (${location.latitude.coordStr()}, ${location.longitude.coordStr()})"
                                        )
                                    } else {
                                        snackbarHostState.showSnackbar("위치를 가져올 수 없습니다")
                                    }
                                } else {
                                    snackbarHostState.showSnackbar("위치 권한이 필요합니다")
                                }
                                isLocating = false
                            }
                        },
                        enabled = !isLocating
                    ) {
                        if (isLocating) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                Icons.Default.LocationOn,
                                contentDescription = "현재 위치",
                                tint = if (currentLocation != null)
                                    MaterialTheme.colorScheme.primary
                                else
                                    MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                },
                supportingText = currentLocation?.let { loc ->
                    { Text("GPS: ${loc.latitude.coordStr()}, ${loc.longitude.coordStr()}") }
                }
            )

            // 인당 가격 미리보기
            pricePerPerson?.let { price ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "1인당 예상 가격",
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Text(
                            text = price.formatPrice(),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }

            // 에러 메시지
            errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // 등록 버튼
            Button(
                onClick = {
                    coroutineScope.launch {
                        isSubmitting = true
                        errorMessage = null
                        try {
                            // 사진이 있으면 S3 presigned URL 발급 → 바이너리 PUT → publicUrl 사용
                            val imageUrl = pickedImage?.let { image ->
                                val presign = OneBiteApi.signUpload(
                                    contentType = "image/jpeg",
                                    size = image.bytes.size.toLong(),
                                )
                                OneBiteApi.uploadToS3(
                                    uploadUrl = presign.uploadUrl,
                                    bytes = image.bytes,
                                    contentType = "image/jpeg",
                                )
                                presign.publicUrl
                            }

                            val request = CreateSplitRequest(
                                productName = productName.trim(),
                                totalPrice = totalPriceInt!!,
                                totalQty = totalQtyInt!!,
                                splitCount = splitCountInt!!,
                                imageUrl = imageUrl,
                                latitude = currentLocation?.latitude ?: 0.0,
                                longitude = currentLocation?.longitude ?: 0.0,
                                address = address.trim()
                            )
                            OneBiteApi.createSplit(request)
                            snackbarHostState.showSnackbar("등록 완료!")
                            onCreated()
                        } catch (e: Exception) {
                            errorMessage = e.message ?: "등록에 실패했습니다"
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = MaterialTheme.shapes.medium,
                enabled = isFormValid && !isSubmitting
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(
                        text = "등록하기",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
